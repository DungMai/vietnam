import { ImageResponse } from '@vercel/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Share card OG image generator.
 * See 02-SPECS/tiktok-share-cards.md — Direction A art lock, no-AI-imagery enforced
 * by selecting only from verified-corpus assets (TODO Stage 4 wires asset allowlist).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const question = searchParams.get('q') ?? 'Saigon, what is the metered taxi fare from the airport?';
  const answer = searchParams.get('a') ?? 'Metered: 250–300k VND. If the driver says the meter is broken — walk away.';
  const province = searchParams.get('p') ?? 'Saigon';
  const accent = searchParams.get('c') ?? '#C44536';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#FBF8F2',
          padding: '64px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 32, background: accent }} />
          <span style={{ fontSize: 22, color: '#4A4A4A' }}>{province}</span>
        </div>
        <div style={{ marginTop: 28, fontSize: 36, color: '#1A1A1A', lineHeight: 1.2 }}>
          {question}
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: '#1A1A1A', lineHeight: 1.35, fontWeight: 500 }}>
          {answer}
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1E5A3B' }}>
            <span style={{ fontSize: 20 }}>✓ Fixer-verified</span>
          </div>
          <span style={{ fontSize: 18, color: '#4A4A4A' }}>vietnam.app</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
