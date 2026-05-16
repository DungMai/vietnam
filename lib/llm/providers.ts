import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';

/**
 * Provider clients. See 03-DECISIONS/0001-tech-stack.md §LLM providers.
 * Single instance per process — SDKs handle internal connection pooling.
 */
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Model IDs per 3-tier router (03-DECISIONS/0002-rag-and-persona-architecture.md §LLM routing).
 * Adjust as new model versions ship; keep IDs in one place.
 */
export const MODEL = {
  tier1Chat: 'gemini-2.5-flash-lite',                  // default — Tier 1, cheapest
  tier2Chat: 'claude-sonnet-4-6',                      // escalation — Tier 2, swing budget
  tier3Translate: 'claude-haiku-4-5-20251001',         // translation — Tier 3, narrow
  embedding: 'gemini-embedding-001',                   // 1536-dim (configurable)
} as const;

export const EMBEDDING_DIMS = 1536;
