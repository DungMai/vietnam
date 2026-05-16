-- Migration 0002 — fixer network + verification trips
-- Source: 02-SPECS/content-corpora-and-fixer.md §fixer operations data model
-- Locked: 2 rotating fixers across 10 provinces, monthly verify cadence (STATUS row 12)

create table fixer (
    id          uuid primary key default gen_random_uuid(),
    full_name   text not null check (length(full_name) > 0),
    handle      text not null unique,            -- public byline, e.g. 'linh-hcm'
    bio_en      text not null check (length(bio_en) > 0),
    bio_vi      text not null check (length(bio_vi) > 0),

    -- regions this fixer is rotation-eligible for (subset of province.id)
    eligible_province_ids uuid[] not null default '{}',

    monthly_rate_usd numeric(7,2) not null default 0,
    active           boolean not null default true,

    created_at timestamptz not null default now()
);

create index fixer_active_idx on fixer (active) where active;

-- verification_trip — a fixer's visit to one province for one period
create table verification_trip (
    id           uuid primary key default gen_random_uuid(),
    fixer_id     uuid not null references fixer(id),
    province_id  uuid not null references province(id),

    period_start date not null,
    period_end   date not null check (period_end >= period_start),

    notes_en text,
    notes_vi text,
    constraint trip_notes_bilingual_pair check (
        (notes_en is null and notes_vi is null)
        or (length(notes_en) > 0 and length(notes_vi) > 0)
    ),

    created_at timestamptz not null default now()
);

create index verification_trip_province_period_idx
    on verification_trip (province_id, period_end desc);
create index verification_trip_fixer_idx on verification_trip (fixer_id);

-- fixer_assignment — the rotation schedule
-- Encodes "2 fixers × 10 provinces, monthly cadence with cycle-offset to defend bias"
-- (content-corpora-and-fixer.md §rotation template)
create table fixer_assignment (
    id           uuid primary key default gen_random_uuid(),
    fixer_id     uuid not null references fixer(id),
    province_id  uuid not null references province(id),
    cycle_month  date not null,           -- first day of month this assignment covers
    cycle_offset integer not null default 0,

    completed_trip_id uuid references verification_trip(id),
    created_at        timestamptz not null default now(),

    unique (fixer_id, cycle_month, cycle_offset),
    unique (province_id, cycle_month)     -- one fixer per province per month
);
