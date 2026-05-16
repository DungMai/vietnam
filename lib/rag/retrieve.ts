import { supabaseServer } from '@/lib/supabase/server';
import { embedQuery } from './embed';
import type { Locale } from '@/types/domain';

export interface RetrievedChunk {
  chunkId: string;
  sourceId: string | null;
  docType: string;
  body: string;
  similarity: number;
}

/**
 * pgvector cosine retrieval, province + lang filtered.
 * See 03-DECISIONS/0002-rag-and-persona-architecture.md §unified index.
 *
 * Calls the SQL function `match_corpus_chunk` (defined in migration 0007 — see below).
 */
export const retrieveTopK = async (args: {
  query: string;
  provinceId: string;
  locale: Locale;
  k?: number;
  minSimilarity?: number;
}): Promise<RetrievedChunk[]> => {
  const { query, provinceId, locale, k = 6, minSimilarity = 0.55 } = args;
  const supabase = await supabaseServer();
  const embedding = await embedQuery(query);

  const { data, error } = await supabase.rpc('match_corpus_chunk', {
    query_embedding: embedding,
    target_province_id: provinceId,
    target_lang: locale,
    match_count: k,
    min_similarity: minSimilarity,
  });

  if (error) {
    console.error('[rag.retrieve]', error);
    return [];
  }

  return (data ?? []).map((row: {
    id: string;
    source_id: string | null;
    doc_type: string;
    body: string;
    similarity: number;
  }) => ({
    chunkId: row.id,
    sourceId: row.source_id,
    docType: row.doc_type,
    body: row.body,
    similarity: row.similarity,
  }));
};

/**
 * Overall retrieval confidence — used by the router to escalate to Tier 2.
 * Simple heuristic: max similarity of top result.
 */
export const retrievalConfidence = (chunks: RetrievedChunk[]): number =>
  chunks.length === 0 ? 0 : chunks[0].similarity;
