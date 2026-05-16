import { embed, embedMany } from 'ai';
import { google, MODEL, EMBEDDING_DIMS } from '@/lib/llm/providers';

/**
 * Embed a single text.
 * See 03-DECISIONS/0002-rag-and-persona-architecture.md §unified pgvector + province filter.
 */
export const embedText = async (text: string): Promise<number[]> => {
  const { embedding } = await embed({
    model: google.textEmbeddingModel(MODEL.embedding),
    value: text,
    providerOptions: {
      google: { outputDimensionality: EMBEDDING_DIMS, taskType: 'RETRIEVAL_DOCUMENT' },
    },
  });
  return embedding;
};

/**
 * Batch embedding for ingestion.
 */
export const embedBatch = async (texts: string[]): Promise<number[][]> => {
  const { embeddings } = await embedMany({
    model: google.textEmbeddingModel(MODEL.embedding),
    values: texts,
    providerOptions: {
      google: { outputDimensionality: EMBEDDING_DIMS, taskType: 'RETRIEVAL_DOCUMENT' },
    },
  });
  return embeddings;
};

/**
 * Embed a user query (different task type → better retrieval).
 */
export const embedQuery = async (query: string): Promise<number[]> => {
  const { embedding } = await embed({
    model: google.textEmbeddingModel(MODEL.embedding),
    value: query,
    providerOptions: {
      google: { outputDimensionality: EMBEDDING_DIMS, taskType: 'RETRIEVAL_QUERY' },
    },
  });
  return embedding;
};
