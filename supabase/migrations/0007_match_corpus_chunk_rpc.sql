-- Migration 0007 — RPC for pgvector retrieval used by lib/rag/retrieve.ts
-- See 03-DECISIONS/0002-rag-and-persona-architecture.md §unified pgvector + province filter

create or replace function match_corpus_chunk(
    query_embedding   vector(1536),
    target_province_id uuid,
    target_lang       text,
    match_count       integer default 6,
    min_similarity    double precision default 0.55
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
    where cc.province_id = target_province_id
      and cc.lang = target_lang
      and cc.embedding is not null
      and 1 - (cc.embedding <=> query_embedding) >= min_similarity
    order by cc.embedding <=> query_embedding
    limit match_count
$$;

comment on function match_corpus_chunk is
    'pgvector cosine similarity retrieval, province + lang filtered.
     Used by lib/rag/retrieve.ts. Lower distance = higher similarity.';
