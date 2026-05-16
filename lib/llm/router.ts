import type { LlmTier } from '@/types/domain';

/**
 * 3-tier LLM router.
 * See 03-DECISIONS/0002-rag-and-persona-architecture.md §LLM routing
 *  + 03-DECISIONS/0003-llm-cost-monitoring.md §kill-switch.
 *
 * Tier 1 — Gemini Flash-Lite. Default for almost everything.
 * Tier 2 — Sonnet 4.5. Escalated only when confidence threshold not met.
 * Tier 3 — Haiku 4.5 for translation. Cheapest, narrow purpose.
 */
export interface RouterInput {
  promptType: 'chat' | 'translation' | 'classification';
  retrievalConfidence?: number;
  killSwitchMode?: 'normal' | 'cheap-only' | 'translate-only' | 'kill';
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

  // chat — escalate to Tier 2 only when retrieval confidence is low
  if (typeof retrievalConfidence === 'number' && retrievalConfidence < 0.55) {
    return 2;
  }
  return 1;
};

// Stubs — replace with actual SDK calls in build phase.
export const callTier1 = async (_prompt: string): Promise<string> => {
  return 'TODO: wire @ai-sdk/google + gemini-2.5-flash-lite';
};
export const callTier2 = async (_prompt: string): Promise<string> => {
  return 'TODO: wire @ai-sdk/anthropic + claude-sonnet-4-6';
};
export const callTier3 = async (_prompt: string): Promise<string> => {
  return 'TODO: wire @ai-sdk/anthropic + claude-haiku-4-5';
};
