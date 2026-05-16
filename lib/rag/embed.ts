import { embed, embedMany } from 'ai';
import { google, MODEL, EMBEDDING_DIMS } from '@/lib/llm/providers';

/**
 * Two model instances — task type is set at model construction time in @ai-sdk/google v1.x.
 * See 03-DECISIONS/0002-rag-and-persona-architecture.md §unified pgvector + province filter.
 */
const docModel = google.textEmbeddingModel(MODEL.embedding, {
  outputDimensionality: EMBEDDING_DIMS,
  taskType: 'RETRIEVAL_DOCUMENT',
});

const queryModel = google.textEmbeddingModel(MODEL.embedding, {
  outputDimensionality: EMBEDDING_DIMS,
  taskType: 'RETRIEVAL_QUERY',
});

/**
 * Embed a single document text.
 */
export const embedText = async (text: string): Promise<number[]> => {
  const { embedding } = await embed({
    model: docModel,
    value: text,
  });
  return embedding;
};

/**
 * Batch embedding for ingestion.
 */
export const embedBatch = async (texts: string[]): Promise<number[][]> => {
  const { embeddings } = await embedMany({
    model: docModel,
    values: texts,
  });
  return embeddings;
};

/**
 * Embed a user query (different task type → better retrieval recall).
 */
export const embedQuery = async (query: string): Promise<number[]> => {
  const { embedding } = await embed({
    model: queryModel,
    value: query,
  });
  return embedding;
};
