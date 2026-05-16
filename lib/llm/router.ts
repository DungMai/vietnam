import { generateText, streamText, type LanguageModel } from 'ai';
import { google, anthropic, MODEL } from './providers';
import type { LlmTier } from '@/types/domain';

/**
 * 3-tier LLM router.
 * See 03-DECISIONS/0002-rag-and-persona-architecture.md §LLM routing
 *  + 03-DECISIONS/0003-llm-cost-monitoring.md §kill-switch.
 *
 * Tier 1 — Gemini Flash-Lite. Default for almost everything.
 * Tier 2 — Sonnet 4.5. Escalated only when retrieval confidence < 0.55.
 * Tier 3 — Haiku 4.5 for translation. Cheapest, narrow purpose.
 */
export type KillSwitchMode = 'normal' | 'cheap-only' | 'translate-only' | 'kill';

export interface RouterInput {
  promptType: 'chat' | 'translation' | 'classification';
  retrievalConfidence?: number;
  killSwitchMode?: KillSwitchMode;
}

export const pickTier = ({
  promptType,
  retrievalConfidence,
  killSwitchMode = 'normal',
}: RouterInput): LlmTier => {
  if (killSwitchMode === 'kill') throw new Error('LLM kill-switch active');
  if (killSwitchMode === 'cheap-only') return 1;
  if (killSwitchMode === 'translate-only') return 3;

  if (promptType === 'translation') return 3;
  if (promptType === 'classification') return 1;

  if (typeof retrievalConfidence === 'number' && retrievalConfidence < 0.55) {
    return 2;
  }
  return 1;
};

export const modelForTier = (tier: LlmTier): LanguageModel => {
  switch (tier) {
    case 1:
      return google(MODEL.tier1Chat);
    case 2:
      return anthropic(MODEL.tier2Chat);
    case 3:
      return anthropic(MODEL.tier3Translate);
  }
};

/**
 * Streaming chat — used by /api/chat. Caller handles SSE serialization.
 */
export const streamChat = (args: {
  tier: LlmTier;
  system: string;
  prompt: string;
  temperature?: number;
}) =>
  streamText({
    model: modelForTier(args.tier),
    system: args.system,
    prompt: args.prompt,
    temperature: args.temperature ?? 0.4,
  });

/**
 * One-shot generation — used by classification, translation, AI pre-screen.
 */
export const generateOnce = (args: { tier: LlmTier; system?: string; prompt: string }) =>
  generateText({
    model: modelForTier(args.tier),
    system: args.system,
    prompt: args.prompt,
  });
