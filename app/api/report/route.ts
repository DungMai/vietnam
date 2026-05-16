import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { prescreenReport, stateFromScore } from '@/lib/moderation/prescreen';

export const runtime = 'nodejs';

const ReportSchema = z.object({
  provinceId: z.string().uuid(),
  body: z.string().min(20).max(2000),
  bodyLang: z.enum(['en', 'vi']),
  sessionId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const parsed = ReportSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const supabase = await supabaseServer();

  // Insert in submitted state first — preserve evidence even if AI call fails.
  const { data: created, error: insertErr } = await supabase
    .from('community_report')
    .insert({
      province_id: parsed.data.provinceId,
      body: parsed.data.body,
      body_lang: parsed.data.bodyLang,
      session_id: parsed.data.sessionId,
      state: 'submitted',
    })
    .select('id')
    .single();
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // AI pre-screen (Tier 1 Gemini Flash-Lite). Failure is non-fatal: stays 'submitted'.
  let screen;
  try {
    screen = await prescreenReport({
      body: parsed.data.body,
      bodyLang: parsed.data.bodyLang,
    });
  } catch (e) {
    console.error('[report.prescreen]', e);
    return NextResponse.json(
      { id: created.id, status: 'submitted', prescreen: 'failed_async_retry' },
      { status: 201 },
    );
  }

  const nextState = stateFromScore(screen.spamScore);
  const { error: updateErr } = await supabase
    .from('community_report')
    .update({
      state: nextState,
      ai_screened_score: screen.spamScore,
      moderator_note_en: screen.category === 'real_report' ? null : `Auto-pre-screen: ${screen.category}. ${screen.reasoning}`,
      moderator_note_vi: screen.category === 'real_report'
        ? null
        : `Tự động sàng lọc: ${screen.category}. ${screen.reasoning}`,
      resolved_at: nextState === 'rejected' ? new Date().toISOString() : null,
    })
    .eq('id', created.id);

  if (updateErr) {
    return NextResponse.json(
      { id: created.id, status: 'submitted', prescreen_update_failed: updateErr.message },
      { status: 201 },
    );
  }

  return NextResponse.json(
    {
      id: created.id,
      status: nextState,
      spamScore: screen.spamScore,
      category: screen.category,
    },
    { status: 201 },
  );
}
