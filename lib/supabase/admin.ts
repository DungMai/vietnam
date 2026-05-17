import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client. Bypasses RLS — never expose to the browser.
 *
 * Used by route handlers and CLI scripts that need to read or write privileged
 * tables (anonymous_session, magic_link_attempt, community_report, llm_call_log,
 * verified_fact non-published rows, etc.).
 *
 * See migration 0011_enable_rls.sql for the threat model that justifies the
 * service-role / anon split.
 *
 * Throws at runtime if SUPABASE_SERVICE_ROLE_KEY is missing — that's the
 * fail-closed default per SECURITY-AUDIT.md CRITICAL #1 remediation.
 */
let _client: SupabaseClient | null = null;

export const supabaseAdmin = (): SupabaseClient => {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('supabaseAdmin: NEXT_PUBLIC_SUPABASE_URL not set');
  }
  if (!serviceKey) {
    throw new Error(
      'supabaseAdmin: SUPABASE_SERVICE_ROLE_KEY not set — refusing to fall back to anon key (would re-introduce SECURITY-AUDIT CRITICAL #1)',
    );
  }

  _client = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return _client;
};
