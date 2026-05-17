import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createHash, randomBytes } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { magicLinkEmail } from '@/lib/email/templates/magic-link';
import { getOrCreateSession } from '@/lib/session/cookie';

export const runtime = 'nodejs';

const TOKEN_TTL_MINUTES = 15;

// sessionId is read from the signed cookie server-side — never accepted from
// the client body. Eliminates a CSRF-style "issue link for any session" attack.
const IssueSchema = z.object({
  email: z.string().email(),
  locale: z.enum(['en', 'vi']),
});

const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

const ipHashFrom = (req: NextRequest): string => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
};

/**
 * POST — issue a 15-min single-use magic link.
 * See 02-SPECS/anonymous-rate-limit-and-email-gate.md.
 */
export async function POST(req: NextRequest) {
  const parsed = IssueSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }
  const { email, locale } = parsed.data;

  // sessionId comes from the signed cookie, not from the request body.
  const session = await getOrCreateSession(locale);
  const sessionId = session.id;

  const supabase = supabaseAdmin();

  // Issue throttle — max 3 pending magic links per email per hour (abuse guard).
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from('magic_link_attempt')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', oneHourAgo)
    .is('consumed_at', null);

  if ((recentCount ?? 0) >= 3) {
    return NextResponse.json(
      { error: 'rate_limited', message: 'Too many requests. Try again in an hour.' },
      { status: 429 },
    );
  }

  // Generate token + insert attempt
  const token = randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();
  const { error: insertErr } = await supabase.from('magic_link_attempt').insert({
    session_id: sessionId,
    email,
    token_hash: hashToken(token),
    locale,
    expires_at: expiresAt,
    issued_ip_hash: ipHashFrom(req),
  });
  if (insertErr) {
    return NextResponse.json({ error: 'db error', detail: insertErr.message }, { status: 500 });
  }

  // Send email
  const origin = req.headers.get('origin') ?? new URL(req.url).origin;
  const consumeUrl = `${origin}/api/magic-link?token=${encodeURIComponent(token)}`;
  const tmpl = magicLinkEmail({ locale, consumeUrl, expiresInMinutes: TOKEN_TTL_MINUTES });
  try {
    await sendEmail({
      to: email,
      subject: tmpl.subject,
      html: tmpl.html,
      text: tmpl.text,
      tags: [
        { name: 'kind', value: 'magic-link' },
        { name: 'locale', value: locale },
      ],
    });
  } catch (e) {
    // Email send failed — keep attempt row (debugging) but return error
    return NextResponse.json(
      { error: 'email_send_failed', detail: e instanceof Error ? e.message : 'unknown' },
      { status: 502 },
    );
  }

  return NextResponse.json({ status: 'issued', sentTo: email, expiresAt });
}

/**
 * GET — consume token, upgrade session to email-attached anonymous.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const token = searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/?gate=invalid', origin));
  }

  const supabase = supabaseAdmin();
  const tokenHash = hashToken(token);

  const { data: attempt } = await supabase
    .from('magic_link_attempt')
    .select('id, session_id, email, expires_at, consumed_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (!attempt) {
    return NextResponse.redirect(new URL('/?gate=invalid', origin));
  }
  if (attempt.consumed_at) {
    return NextResponse.redirect(new URL('/?gate=consumed_already', origin));
  }
  if (new Date(attempt.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(new URL('/?gate=expired', origin));
  }

  // Mark consumed + upgrade session
  await supabase
    .from('magic_link_attempt')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', attempt.id);

  await supabase
    .from('anonymous_session')
    .update({
      email: attempt.email,
      email_verified_at: new Date().toISOString(),
    })
    .eq('id', attempt.session_id);

  return NextResponse.redirect(new URL('/?gate=verified', origin));
}
