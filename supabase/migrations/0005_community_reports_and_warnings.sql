-- Migration 0005 — community scam reports + scam warning escalation
-- Source: 02-SPECS/anti-scam-loop.md §community report flow + scam warning tiers

create type report_state as enum (
    'submitted', 'ai_screened', 'fixer_review', 'published', 'rejected'
);

create table community_report (
    id           uuid primary key default gen_random_uuid(),
    session_id   uuid not null references anonymous_session(id),
    province_id  uuid not null references province(id),

    -- user describes the scam in their language; we don't enforce bilingual on user input
    body         text not null check (length(body) > 0),
    body_lang    text not null check (body_lang in ('en', 'vi')),

    state        report_state not null default 'submitted',
    ai_screened_score numeric(4,3),                  -- 0..1; > 0.7 → fast-track to fixer
    moderator_note_en text,
    moderator_note_vi text,
    constraint report_mod_note_bilingual_pair check (
        (moderator_note_en is null and moderator_note_vi is null)
        or (length(moderator_note_en) > 0 and length(moderator_note_vi) > 0)
    ),

    created_at  timestamptz not null default now(),
    resolved_at timestamptz
);

create index community_report_state_idx on community_report (state, created_at desc);
create index community_report_province_idx on community_report (province_id);

-- scam_warning — published, fixer-curated warnings shown on province pages
create type warning_tier as enum ('advisory', 'alert', 'red');

create table scam_warning (
    id           uuid primary key default gen_random_uuid(),
    province_id  uuid not null references province(id),

    title_en text not null check (length(title_en) > 0),
    title_vi text not null check (length(title_vi) > 0),
    body_en  text not null check (length(body_en) > 0),
    body_vi  text not null check (length(body_vi) > 0),

    tier         warning_tier not null default 'advisory',
    fixer_signature_id uuid references fixer_signature(id),

    promoted_from_report_count integer not null default 0,
    -- promotion logic (anti-scam-loop.md §tier-promotion truth table)
    -- advisory: 1 fixer signature OR 3 corroborating community reports
    -- alert:    fixer escalation OR 7 reports in 14 days
    -- red:      fixer red-flag OR 15 reports in 7 days

    published_at timestamptz,
    expires_at   timestamptz,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

create index scam_warning_province_tier_idx on scam_warning (province_id, tier);
create index scam_warning_active_idx on scam_warning (province_id)
    where published_at is not null and (expires_at is null or expires_at > now());
