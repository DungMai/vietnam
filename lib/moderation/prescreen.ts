import { generateObject } from 'ai';
import { z } from 'zod';
import { modelForTier } from '@/lib/llm/router';

const PrescreenSchema = z.object({
  spamScore: z.number().min(0).max(1),
  category: z.enum(['real_report', 'spam', 'off_topic', 'abuse', 'unclear']),
  reasoning: z.string().max(300),
});

export type PrescreenResult = z.infer<typeof PrescreenSchema>;

const SYSTEM = `You are a moderation pre-screen for a Vietnamese travel safety platform.
Users submit reports about scams they encountered. Your job: classify each submission.

Classes:
- "real_report": describes a specific, plausible scam pattern with location/time/method
- "spam": promotional, repetitive, link-spam, unrelated commercial content
- "off_topic": about something other than a Vietnam-province scam
- "abuse": harassment, hate, or personal attacks (auto-reject)
- "unclear": too vague or short to evaluate

spamScore semantics:
- 0.0–0.3 = real_report (fast-track to fixer review)
- 0.3–0.7 = unclear (manual triage)
- 0.7–1.0 = spam/off_topic/abuse (reject)

Be lenient toward genuine reports written in broken English or Vietnamese — vocabulary
is not a signal of authenticity. Specifics (place, price, exact words) are.
Be strict against generic complaints with no actionable detail.`;

export const prescreenReport = async (args: {
  body: string;
  bodyLang: 'en' | 'vi';
}): Promise<PrescreenResult> => {
  const { object } = await generateObject({
    model: modelForTier(1),
    system: SYSTEM,
    prompt: `Report (language: ${args.bodyLang}):\n\n${args.body}\n\nClassify.`,
    schema: PrescreenSchema,
  });
  return object;
};

/**
 * Map score → state transition.
 * See migration 0005 §community_report state enum.
 */
export const stateFromScore = (score: number): 'fixer_review' | 'ai_screened' | 'rejected' => {
  if (score >= 0.7) return 'rejected';
  if (score <= 0.3) return 'fixer_review';
  return 'ai_screened';
};
