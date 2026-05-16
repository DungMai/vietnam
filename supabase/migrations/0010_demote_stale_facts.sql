-- Migration 0010 — stale fact demotion + chat-time state filter
-- Source: 02-SPECS/anti-scam-loop.md §lifecycle state machine
--         (published → stale after 30 days unless re-verified)

-- SQL function: transition expired facts from 'published' to 'stale'.
-- Idempotent — safe to run on a cron.
create or replace function demote_stale_facts()
returns table (
    demoted_count integer,
    sample_ids    uuid[]
)
language plpgsql as $$
declare
    sample uuid[];
    cnt    integer;
begin
    -- snapshot the IDs we're about to demote (for the log)
    select array_agg(id) into sample
      from (
        select id from verified_fact
         where state = 'published'
           and expires_at is not null
           and expires_at < now()
         limit 50
      ) s;

    update verified_fact
       set state = 'stale',
           updated_at = now()
     where state = 'published'
       and expires_at is not null
       and expires_at < now();
    get diagnostics cnt = row_count;

    return query select cnt, coalesce(sample, '{}'::uuid[]);
end;
$$;

comment on function demote_stale_facts is
    'Demotes published facts whose expires_at is past. Idempotent. Run on
     a daily cron (Supabase scheduled function, cron-job.org, GitHub Actions,
     or pnpm db:demote-stale CLI).';

-- Drop & recreate match_corpus_chunk to also filter out demoted facts.
-- Stale facts STAY retrievable so we can warn the user "possibly stale";
-- demoted facts are hidden entirely (they're wrong, not just old).
create or replace function match_corpus_chunk(
    query_embedding    vector(1536),
    target_province_id uuid,
    target_lang        text,
    match_count        integer default 6,
    min_similarity     double precision default 0.55
)
returns table (
    id        uuid,
    source_id uuid,
    doc_type  text,
    body      text,
    similarity double precision
)
language sql stable as $$
    select
        cc.id,
        cc.source_id,
        cc.doc_type,
        cc.body,
        1 - (cc.embedding <=> query_embedding) as similarity
    from corpus_chunk cc
    left join verified_fact vf on vf.id = cc.source_id and cc.doc_type = 'verified_fact'
    where cc.province_id = target_province_id
      and cc.lang = target_lang
      and cc.embedding is not null
      and 1 - (cc.embedding <=> query_embedding) >= min_similarity
      -- exclude demoted facts entirely; keep stale (UI flags them visually)
      and (vf.id is null or vf.state in ('published', 'stale'))
    order by cc.embedding <=> query_embedding
    limit match_count
$$;
