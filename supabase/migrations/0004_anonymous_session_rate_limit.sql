-- Migration 0004 — anonymous session + rate limit gate
-- Source: 02-SPECS/anonymous-rate-limit-and-email-gate.md
-- Locked: cookie-based anonymous session, 20 msg/day rolling cap pre-gate,
--         80/day post-gate, 15-min single-use magic link

create table anonymous_session (
    id              uuid primary key default gen_random_uuid(),
    cookie_token    text not null unique,           -- HMAC-signed cookie value
    ua_hash         text,
    ip_hash         text,                           -- privacy-preserving hash, not raw IP
    locale          text not null check (locale in ('en', 'vi')) default 'en',

    email           text,                           -- attached after magic-link upgrade (still anon)
    email_verified_at timestamptz,

    daily_msg_count   integer not null default 0,
    daily_msg_window_start timestamptz not null default now(),

    created_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now()
);

create index anonymous_session_email_idx on anonymous_session (email)
    where email is not null;
create index anonymous_session_last_seen_idx on anonymous_session (last_seen_at);

-- magic-link issue + consume (single-use, 15-min expiry)
create table magic_link_attempt (
    id          uuid primary key default gen_random_uuid(),
    session_id  uuid not null references anonymous_session(id),
    email       text not null,
    token_hash  text not null,                       -- sha256(token); only hash stored
    locale      text not null check (locale in ('en', 'vi')),

    expires_at  timestamptz not null,
    consumed_at timestamptz,
    issued_ip_hash text,

    created_at timestamptz not null default now()
);

create index magic_link_email_pending_idx on magic_link_attempt (email)
    where consumed_at is null;
create index magic_link_expires_idx on magic_link_attempt (expires_at)
    where consumed_at is null;
