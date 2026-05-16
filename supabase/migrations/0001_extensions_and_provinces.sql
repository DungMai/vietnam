-- Migration 0001 — extensions + provinces base table
-- Source: 03-DECISIONS/0001-tech-stack.md, 03-DECISIONS/0002-rag-and-persona-architecture.md
-- Locked: 10 Tier-1 provinces (STATUS row 10), bilingual *_en/*_vi parallel cols with NOT NULL CHECK
--         (STATUS row 13, bilingual-content-and-rendering.md), "Sài Gòn" persona vs "TP.HCM" admin
--         (STATUS row 19)

create extension if not exists pgcrypto;
create extension if not exists vector;
create extension if not exists pg_trgm;

-- =============================================================================
-- provinces — 10 Tier-1 administrative units (post-2025 reform)
-- =============================================================================
-- Bilingual convention: every user-facing string has _en + _vi parallel columns.
-- display_name_persona = how the agent self-references (warm: "Sài Gòn", "Hà Nội")
-- display_name_admin   = how admin/system labels render (neutral: "TP.HCM", "Hà Nội")
-- Both NEVER mixed in one sentence — enforced by usage convention, not schema.

create table province (
    id            uuid primary key default gen_random_uuid(),
    slug          text not null unique,           -- url slug, lowercase ASCII, e.g. 'hcm', 'hanoi'

    display_name_persona_en text not null check (length(display_name_persona_en) > 0),
    display_name_persona_vi text not null check (length(display_name_persona_vi) > 0),
    display_name_admin_en   text not null check (length(display_name_admin_en) > 0),
    display_name_admin_vi   text not null check (length(display_name_admin_vi) > 0),

    persona_archetype_en text not null check (length(persona_archetype_en) > 0),
    persona_archetype_vi text not null check (length(persona_archetype_vi) > 0),

    -- one accent hue per province (Direction A art lock)
    accent_color  text not null check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),

    -- per-province quality score 0..100; computed view in migration 0003
    -- this column is the materialized cache; source-of-truth is the view
    quality_score_cached integer not null default 0 check (quality_score_cached between 0 and 100),

    -- pre-2025 admin context for SEO + user-facing transparency
    legacy_admin_note_en text,
    legacy_admin_note_vi text,
    -- enforce bilingual completeness: both NULL or both filled
    constraint legacy_note_bilingual_pair check (
        (legacy_admin_note_en is null and legacy_admin_note_vi is null)
        or (length(legacy_admin_note_en) > 0 and length(legacy_admin_note_vi) > 0)
    ),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index province_slug_idx on province (slug);

comment on column province.display_name_persona_en is
    'Persona self-reference in EN (e.g. "Saigon"). Use in chat output, hero copy.';
comment on column province.display_name_admin_en is
    'Admin/system label in EN (e.g. "Ho Chi Minh City"). Use in metadata, footnotes.';
