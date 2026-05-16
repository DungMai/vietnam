import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { getOrCreateSession, incrementDailyMessage, RateLimitExceeded } from '@/lib/session/cookie';
import { retrieveTopK, retrievalConfidence } from '@/lib/rag/retrieve';
import { buildSystemPrompt } from '@/lib/persona/prompt';
import { pickTier, streamChat } from '@/lib/llm/router';
import type { Locale } from '@/types/domain';

// Node runtime (cookies + crypto), not Edge — see 02-SPECS/anonymous-rate-limit §implementation
export const runtime = 'nodejs';

const ChatBodySchema = z.object({
  provinceSlug: z.string().min(1).max(32),
  message: z.string().min(1).max(2000),
  locale: z.enum(['en', 'vi']).default('en'),
});

/**
 * SSE chat endpoint.
 * Flow: session → rate-limit → province lookup → RAG retrieve → router pick →
 *       persona system prompt → streamText → parse [^factId] → emit token/citation events.
 * See 02-SPECS/trust-citation-rendering.md §SSE protocol.
 */
export async function POST(req: NextRequest) {
  const parsed = ChatBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'invalid payload' }), { status: 400 });
  }
  const { provinceSlug, message, locale } = parsed.data;

  const session = await getOrCreateSession(locale);
  let rateCheck;
  try {
    rateCheck = await incrementDailyMessage(session);
  } catch (e) {
    if (e instanceof RateLimitExceeded) {
      return new Response(
        JSON.stringify({ error: 'rate_limited', count: e.count, cap: e.capForTier }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      );
    }
    throw e;
  }

  const supabase = await supabaseServer();
  const { data: province } = await supabase
    .from('province')
    .select('id, slug')
    .eq('slug', provinceSlug)
    .maybeSingle();
  if (!province) {
    return new Response(JSON.stringify({ error: 'province not found' }), { status: 404 });
  }

  const chunks = await retrieveTopK({
    query: message,
    provinceId: province.id,
    locale,
    k: 6,
  });
  const tier = pickTier({
    promptType: 'chat',
    retrievalConfidence: retrievalConfidence(chunks),
  });
  const system = buildSystemPrompt({ provinceSlug, locale, chunks });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );

      send('meta', { tier, retrieved: chunks.length, msgCount: rateCheck.count, cap: rateCheck.cap });

      // Emit citation payloads for every retrieved fact up-front so client can resolve
      // [^factId] inline as tokens stream in.
      const factIds = chunks.map((c) => c.sourceId).filter((id): id is string => !!id);
      if (factIds.length > 0) {
        const { data: facts } = await supabase
          .from('verified_fact')
          .select(
            'id, body_en, body_vi, category, verified_at, expires_at, source_url, fixer_signature(fixer:fixer(handle, full_name), signed_at)',
          )
          .in('id', factIds);

        for (const f of facts ?? []) {
          const sig = Array.isArray(f.fixer_signature) ? f.fixer_signature[0] : f.fixer_signature;
          const fixer = Array.isArray(sig?.fixer) ? sig.fixer[0] : sig?.fixer;
          send('citation', {
            factId: f.id,
            body: locale === 'vi' ? f.body_vi : f.body_en,
            category: f.category,
            verifiedAt: f.verified_at,
            isStale: f.expires_at ? new Date(f.expires_at).getTime() < Date.now() : false,
            sourceUrl: f.source_url,
            fixer: fixer
              ? { handle: fixer.handle, fullName: fixer.full_name, signedAt: sig?.signed_at }
              : undefined,
          });
        }
      }

      try {
        const result = streamChat({ tier, system, prompt: message });
        for await (const delta of result.textStream) {
          send('token', { delta });
        }

        const final = await result.text;
        const usage = await result.usage;

        // log cost for monitoring (03-DECISIONS/0003-llm-cost-monitoring.md)
        await supabase.from('llm_call_log').insert({
          session_id: session.id,
          province_id: province.id,
          tier,
          provider: tier === 1 ? 'google' : 'anthropic',
          model: tier === 1 ? 'gemini-2.5-flash-lite' : tier === 2 ? 'claude-sonnet-4-6' : 'claude-haiku-4-5',
          prompt_tokens: usage?.promptTokens ?? 0,
          output_tokens: usage?.completionTokens ?? 0,
          // cost computed offline by daily rollup; left at 0 here
        });

        send('done', { finalLength: final.length });
      } catch (e) {
        send('error', { message: e instanceof Error ? e.message : String(e) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
