import type { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * SSE streaming chat endpoint.
 * See 02-SPECS/trust-citation-rendering.md §SSE protocol:
 *   event: token       — partial chat content
 *   event: citation    — verified-fact payload attaching to a token range
 *   event: done        — stream complete
 */
export async function POST(_req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );

      // TODO Stage 4: classify → retrieve from corpus_chunk (pgvector) →
      //   pick LLM tier via lib/llm/router.ts → stream tokens + citations.
      send('token', { delta: 'TODO: wire RAG + 3-tier router + persona system prompt.' });
      send('done', {});
      controller.close();
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
