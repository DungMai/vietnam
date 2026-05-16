-- Migration 0003 — corpus chunks (pgvector) + verified facts + quality-score view
-- Source: 02-SPECS/anti-scam-loop.md §data model,
--         03-DECISIONS/0002-rag-and-persona-architecture.md §unified pgvector + province filter,
--         02-SPECS/content-corpora-and-fixer.md §corpus structure
-- Locked: unified pgvector index with province metadata filter;
--         bilingual *_en/*_vi parallel cols on facts;
--         corpus_chunk is single-exception with `lang` discriminator (chunks embedded per language)

-- =============================================================================
-- corpus_chunk — single unified pgvector store; province + lang filtered at query time
-- =============================================================================
create table corpus_chunk (
    id           uuid primary key default gen_random_uuid(),
    province_id  uuid not null references province(id),
    lang         text not null check (lang in ('en', 'vi')),
    doc_type     text not null check (doc_type in (
        'verified_fact', 'persona_line', 'cultural_essay',
        'scam_warning', 'fixer_note', 'province_meta'
    )),
    source_id    uuid,                          -- nullable FK to source row (e.g. verified_fact.id)
    body         text not null check (length(body) > 0),
    embedding    vector(1536),                  -- text-embedding-3-small (1536-dim)
    metadata     jsonb not null default '{}',
    created_at   timestamptz not null default now()
);

create index corpus_chunk_province_lang_idx on corpus_chunk (province_id, lang);
create index corpus_chunk_doc_type_idx on corpus_chunk (doc_type);
-- HNSW index for ANN retrieval at scale (see 03-DECISIONS/0002 §unified index)
create index corpus_chunk_embedding_hnsw_idx on corpus_chunk
    using hnsw (embedding vector_cosine_ops);

-- =============================================================================
-- verified_fact — the load-bearing trust artifact
-- =============================================================================
-- State machine: draft → fixer_review → published → (stale|demoted)
-- (anti-scam-loop.md §lifecycle state machine)
create type fact_state as enum ('draft', 'fixer_review', 'published', 'stale', 'demoted');

create table verified_fact (
    id           uuid primary key default gen_random_uuid(),
    province_id  uuid not null references province(id),

    body_en text not null check (length(body_en) > 0),
    body_vi text not null check (length(body_vi) > 0),

    category text not null check (category in (
        'price',         -- "taxi from SGN to Q1 = 250–300k VND metered"
        'hours',         -- "Bún bò Huế Tu Trinh opens 5:30am, closes when sold out"
        'location',      -- "real entrance is on alley side, not main street"
        'scam_pattern',  -- "drivers will say meter broken — walk away"
        'culture',       -- "Tết altar offering order"
        'history',       -- "Huế citadel layout 1804–"
        'logistics',     -- "Phú Quốc cable car schedule"
        'other'
    )),

    -- citation source — fixer-verified is the gold standard
    state             fact_state not null default 'draft',
    fixer_signature_id uuid,           -- FK declared after fixer_signature table

    verified_at  timestamptz,
    expires_at   timestamptz,
    source_url   text,
    source_note_en text,
    source_note_vi text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint fact_published_requires_verification check (
        state <> 'published' or (verified_at is not null and fixer_signature_id is not null)
    ),
    constraint fact_source_note_bilingual_pair check (
        (source_note_en is null and source_note_vi is null)
        or (length(source_note_en) > 0 and length(source_note_vi) > 0)
    )
);

create index verified_fact_province_state_idx on verified_fact (province_id, state);
create index verified_fact_expires_idx on verified_fact (expires_at)
    where state = 'published';

-- =============================================================================
-- fixer_signature — atomic verification record signed by a fixer
-- =============================================================================
create table fixer_signature (
    id                  uuid primary key default gen_random_uuid(),
    fixer_id            uuid not null references fixer(id),
    verification_trip_id uuid not null references verification_trip(id),
    fact_id             uuid not null references verified_fact(id),

    -- snapshot of fact body at sign-time (audit trail; survives edits)
    signed_body_en text not null,
    signed_body_vi text not null,
    signed_at      timestamptz not null default now(),

    unique (fact_id, fixer_id, verification_trip_id)
);

alter table verified_fact
    add constraint fact_fixer_signature_fk
    foreign key (fixer_signature_id) references fixer_signature(id);

-- =============================================================================
-- per-province quality score view
-- (anti-scam-loop.md §per-province quality score formula)
-- score = pct( published facts with fresh fixer verification < 30d
--              AND no active scam_warning escalation > advisory )
-- =============================================================================
create or replace view province_quality_score as
select
    p.id as province_id,
    p.slug,
    coalesce(
        round(
            100.0 * count(vf.id) filter (where
                vf.state = 'published'
                and vf.verified_at >= now() - interval '30 days'
            )::numeric
            / nullif(count(vf.id) filter (where vf.state = 'published'), 0),
            0
        ),
        0
    )::integer as score
from province p
left join verified_fact vf on vf.province_id = p.id
group by p.id, p.slug;

comment on view province_quality_score is
    'Live per-province quality score. The province.quality_score_cached column is refreshed nightly from this view.';
