-- Migration 0009 — asset table + no-AI-imagery enforcement at DB level
-- Source: 02-SPECS/content-corpora-and-fixer.md §asset pipeline + docs/NO_AI_IMAGERY.md

create type asset_provenance as enum (
    'fixer_camera',          -- shot by a fixer during verification trip
    'licensed_photographer', -- licensed from a named VN photographer
    'user_attestation'       -- user-submitted with provenance statement
);

create type asset_review_state as enum (
    'uploaded',          -- raw upload, EXIF + AI-marker checks not yet run
    'auto_screened',     -- passed EXIF + AI-marker checks
    'fixer_reviewing',   -- in fixer review queue
    'published',         -- visible to users
    'rejected'           -- failed any check; reason logged
);

create table asset (
    id           uuid primary key default gen_random_uuid(),
    province_id  uuid not null references province(id),

    -- storage pointer
    r2_key       text not null unique,         -- R2 object key
    sha256       text not null,                -- file hash; dedup + tamper detect
    mime_type    text not null check (mime_type in ('image/jpeg', 'image/png', 'image/heic', 'image/webp')),
    size_bytes   integer not null check (size_bytes > 0),
    width        integer,
    height       integer,

    -- provenance
    provenance_kind asset_provenance not null,
    photographer_name text,                    -- public byline for credit
    photographer_credit_url text,
    capture_date date,

    -- bilingual caption
    caption_en text,
    caption_vi text,
    constraint asset_caption_bilingual_pair check (
        (caption_en is null and caption_vi is null)
        or (length(caption_en) > 0 and length(caption_vi) > 0)
    ),

    -- the 4 checkpoints (docs/NO_AI_IMAGERY.md)
    exif_check_passed   boolean not null default false,
    exif_check_findings jsonb,                 -- what was found (provider, signatures, etc.)
    phash_check_passed  boolean not null default false,
    phash_distance_min  numeric(5,4),          -- min distance to known-AI corpus
    fixer_review_signature_id uuid references fixer_signature(id),
    ci_scan_passed      boolean not null default false,

    state        asset_review_state not null default 'uploaded',
    rejection_reason text,

    uploaded_by_session uuid references anonymous_session(id),
    uploaded_at  timestamptz not null default now(),
    published_at timestamptz,
    updated_at   timestamptz not null default now(),

    -- published assets MUST have passed all 4 checkpoints
    constraint asset_published_all_checkpoints check (
        state <> 'published' or (
            exif_check_passed
            and phash_check_passed
            and fixer_review_signature_id is not null
            and ci_scan_passed
        )
    )
);

create index asset_province_state_idx on asset (province_id, state);
create index asset_published_idx on asset (province_id) where state = 'published';
create index asset_sha256_idx on asset (sha256);

-- Public view: only fully-vetted assets are exposed to the user-facing app.
-- Frontend should query this view, never the raw table.
create view public_asset as
select
    id, province_id, r2_key, mime_type, width, height,
    provenance_kind, photographer_name, photographer_credit_url,
    capture_date, caption_en, caption_vi, published_at
from asset
where state = 'published'
  and exif_check_passed
  and phash_check_passed
  and fixer_review_signature_id is not null
  and ci_scan_passed;

comment on view public_asset is
    'Filtered view of assets safe to surface to users. Anything that bypasses
     the 4 checkpoints is invisible at the query layer, not just the UI layer.';
