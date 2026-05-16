-- Migration 0006 — LLM call log + daily cost rollup view
-- Source: 03-DECISIONS/0003-llm-cost-monitoring.md
-- Locked: per-tier alarms ($40/$25/$20 + $60 warn / $100 crit total),
--         70% cache-hit target, kill-switch modes

create table llm_call_log (
    id             uuid primary key default gen_random_uuid(),
    session_id     uuid references anonymous_session(id),
    province_id    uuid references province(id),

    tier           smallint not null check (tier in (1, 2, 3)),
    provider       text not null check (provider in ('google', 'anthropic', 'openai')),
    model          text not null,

    cache_hit      boolean not null default false,
    response_cache_key text,
    retrieval_cache_hit boolean not null default false,

    prompt_tokens  integer not null default 0,
    output_tokens  integer not null default 0,
    cost_usd       numeric(10,6) not null default 0,

    latency_ms     integer,
    error          text,

    created_at timestamptz not null default now()
);

create index llm_call_log_created_tier_idx on llm_call_log (created_at desc, tier);
create index llm_call_log_province_idx on llm_call_log (province_id, created_at desc);

-- daily rollup for cost monitoring
create or replace view llm_cost_daily as
select
    date_trunc('day', created_at)::date as day,
    tier,
    province_id,
    count(*)                            as call_count,
    count(*) filter (where cache_hit)   as cache_hits,
    sum(cost_usd)                       as total_cost_usd,
    avg(latency_ms)                     as avg_latency_ms
from llm_call_log
group by 1, 2, 3;

comment on view llm_cost_daily is
    'Daily LLM cost rollup by tier + province. Sentry alarms thresholded from this view (0003-llm-cost-monitoring.md §alarms).';
