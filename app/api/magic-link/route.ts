import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

const IssueSchema = z.object({
  email: z.string().email(),
  sessionId: z.string().uuid(),
  locale: z.enum(['en', 'vi']),
});

/**
 * POST — issue a 15-min single-use magic link.
 * GET  — consume token + upgrade session to email-attached anonymous (still anon).
 * See 02-SPECS/anonymous-rate-limit-and-email-gate.md.
 */
export async function POST(req: NextRequest) {
  const parsed = IssueSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }

  // TODO Stage 4:
  //   1. rate-limit issue attempts per email + IP
  //   2. insert magic_link_attempt row (sha256(token), expires_at = now + 15min)
  //   3. send via Resend with locale-aware copy
  return NextResponse.json({ status: 'issued', sentTo: parsed.data.email });
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

  // TODO Stage 4: hash + lookup + consume (mark consumed_at) + upgrade session.
  return NextResponse.redirect(new URL('/?gate=consumed', req.url));
}
