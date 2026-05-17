-- Migration 0011 — enable Row-Level Security on all tables + minimal anon policies
--
-- Source: SECURITY-AUDIT.md CRITICAL #1 (Stage 5 harden pass, 2026-05-17).
-- Before this migration: anon key (public in browser bundle) granted full
-- PostgREST read/write to every table, collapsing the trust wedge + rate-limit
-- gate + magic-link gate simultaneously.
--
-- After this migration:
--   - Every table has RLS enabled.
--   - Anon role gets SELECT only on rows that are intentionally public.
--   - Anon role has NO write access to any table.
--   - All writes + privileged reads must go through the service-role key
--     (lib/supabase/admin.ts; never exposed to the browser).
--
-- service_role is exempt from RLS by default (Supabase convention), so this
-- migration does not need explicit service_role policies.

-- =============================================================================
-- 1. Enable RLS on every table
-- =============================================================================
alter table province              enable row level security;
alter table fixer                 enable row level security;
alter table verification_trip     enable row level security;
alter table fixer_assignment      enable row level security;
alter table corpus_chunk          enable row level security;
alter table verified_fact         enable row level security;
alter table fixer_signature       enable row level security;
alter table anonymous_session     enable row level security;
alter table magic_link_attempt    enable row level security;
alter table community_report      enable row level security;
alter table scam_warning          enable row level security;
alter table llm_call_log          enable row level security;
alter table asset                 enable row level security;

-- =============================================================================
-- 2. Anon SELECT policies on intentionally-public tables
-- =============================================================================

-- All 10 Tier-1 provinces are public.
create policy "anon_read_province"
  on province
  for select
  to anon
  using (true);

-- Active fixers are public (for citation byline display).
create policy "anon_read_active_fixers"
  on fixer
  for select
  to anon
  using (active = true);

-- Published + stale verified facts are public.
-- Demoted facts (state='demoted') stay hidden.
create policy "anon_read_published_or_stale_facts"
  on verified_fact
  for select
  to anon
  using (state in ('published', 'stale'));

-- Fixer signatures are public (so citation modal can show signature line).
create policy "anon_read_fixer_signatures"
  on fixer_signature
  for select
  to anon
  using (true);

-- Active scam warnings are public.
create policy "anon_read_active_warnings"
  on scam_warning
  for select
  to anon
  using (
    published_at is not null
    and (expires_at is null or expires_at > now())
  );

-- Fully-vetted assets are public (matches the public_asset view contract;
-- docs/NO_AI_IMAGERY.md §4-checkpoint enforcement).
create policy "anon_read_public_assets"
  on asset
  for select
  to anon
  using (
    state = 'published'
    and exif_check_passed
    and phash_check_passed
    and fixer_review_signature_id is not null
    and ci_scan_passed
  );

-- =============================================================================
-- 3. Tables with NO anon access (privileged only)
-- =============================================================================
-- The following tables have NO anon policy intentionally, denying anon all
-- access. All reads + writes go through service-role:
--   - corpus_chunk            (server-side RAG retrieval only)
--   - anonymous_session       (session state — never readable by clients)
--   - magic_link_attempt      (token hashes — never exposed)
--   - community_report        (submitter cannot enumerate others')
--   - verification_trip       (operational data)
--   - fixer_assignment        (operational schedule)
--   - llm_call_log            (cost data; founder-only)

-- =============================================================================
-- 4. Grant view access for analytics-style views
-- =============================================================================
-- Views inherit RLS from underlying tables. We grant SELECT explicitly so
-- PostgREST exposes them, and the underlying anon policies above gate access.
grant select on province_quality_score to anon;
grant select on public_asset to anon;
grant select on llm_cost_daily to service_role;       -- explicit; not exposed to anon

-- =============================================================================
-- 5. Revoke any inadvertent grants on raw tables
-- =============================================================================
-- Defense in depth: even if a future migration accidentally grants anon
-- access to a raw table, the RLS check still applies. But we explicitly
-- revoke modify privileges so the only path is via service-role.

revoke insert, update, delete on
    province, fixer, verification_trip, fixer_assignment,
    corpus_chunk, verified_fact, fixer_signature,
    anonymous_session, magic_link_attempt, community_report,
    scam_warning, llm_call_log, asset
  from anon;
