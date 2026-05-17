import { cookies } from 'next/headers';
import { createHmac, randomBytes } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Locale } from '@/types/domain';

const COOKIE_NAME = 'vn_sess';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

const hmacSecret = () => process.env.SHARE_CARD_HMAC_SECRET ?? 'dev-only-secret';
const sign = (id: string) => createHmac('sha256', hmacSecret()).update(id).digest('hex');
const tokenFor = (id: string) => `${id}.${sign(id)}`;
const verifyToken = (token: string): string | null => {
  const [id, sig] = token.split('.');
  if (!id || !sig) return null;
  return sig === sign(id) ? id : null;
};

export interface AnonSession {
  id: string;
  locale: Locale;
  emailVerified: boolean;
  dailyMsgCount: number;
  dailyWindowStart: string;
}

/**
 * Read existing session from cookie OR create a new one.
 * Called from middleware on every request.
 * See 02-SPECS/anonymous-rate-limit-and-email-gate.md §anonymous identity model.
 */
export const getOrCreateSession = async (locale: Locale = 'en'): Promise<AnonSession> => {
  const store = await cookies();
  const cookieToken = store.get(COOKIE_NAME)?.value;
  const supabase = supabaseAdmin();

  if (cookieToken) {
    const id = verifyToken(cookieToken);
    if (id) {
      const { data } = await supabase
        .from('anonymous_session')
        .select('id, locale, email_verified_at, daily_msg_count, daily_msg_window_start')
        .eq('id', id)
        .maybeSingle();
      if (data) {
        return {
          id: data.id,
          locale: data.locale as Locale,
          emailVerified: !!data.email_verified_at,
          dailyMsgCount: data.daily_msg_count,
          dailyWindowStart: data.daily_msg_window_start,
        };
      }
    }
  }

  const newId = randomBytes(16).toString('hex');
  const { data, error } = await supabase
    .from('anonymous_session')
    .insert({ id: newId, cookie_token: tokenFor(newId), locale })
    .select('id, locale, email_verified_at, daily_msg_count, daily_msg_window_start')
    .single();
  if (error) throw error;

  store.set(COOKIE_NAME, tokenFor(newId), {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  return {
    id: data.id,
    locale: data.locale as Locale,
    emailVerified: false,
    dailyMsgCount: 0,
    dailyWindowStart: data.daily_msg_window_start,
  };
};

/**
 * Atomically check + increment rate limit. Returns the post-increment count.
 * Throws RateLimitExceeded when over cap (caller renders S-rate-limit).
 * See 02-SPECS/anonymous-rate-limit-and-email-gate.md §rate-limit policy.
 */
export class RateLimitExceeded extends Error {
  constructor(public count: number, public capForTier: number) {
    super(`rate-limit: ${count}/${capForTier}`);
  }
}

export const CAP_PRE_GATE = 20;
export const CAP_POST_GATE = 80;

export const incrementDailyMessage = async (
  session: AnonSession,
): Promise<{ count: number; cap: number }> => {
  const cap = session.emailVerified ? CAP_POST_GATE : CAP_PRE_GATE;
  const supabase = supabaseAdmin();

  // 24h rolling window — reset if window started > 24h ago
  const windowAge = Date.now() - new Date(session.dailyWindowStart).getTime();
  const shouldReset = windowAge > 24 * 60 * 60 * 1000;

  if (shouldReset) {
    const { data, error } = await supabase
      .from('anonymous_session')
      .update({ daily_msg_count: 1, daily_msg_window_start: new Date().toISOString() })
      .eq('id', session.id)
      .select('daily_msg_count')
      .single();
    if (error) throw error;
    return { count: data.daily_msg_count, cap };
  }

  if (session.dailyMsgCount >= cap) {
    throw new RateLimitExceeded(session.dailyMsgCount, cap);
  }

  const { data, error } = await supabase.rpc('increment_session_msg', { session_id: session.id });
  if (error) throw error;
  return { count: data as number, cap };
};
