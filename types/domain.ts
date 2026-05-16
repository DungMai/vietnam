/**
 * Shared domain types mirroring SQL schemas in supabase/migrations/.
 * Source-of-truth is SQL; keep these in sync when migrations change.
 */

export type Locale = 'en' | 'vi';

export type FactCategory =
  | 'price'
  | 'hours'
  | 'location'
  | 'scam_pattern'
  | 'culture'
  | 'history'
  | 'logistics'
  | 'other';

export type FactState = 'draft' | 'fixer_review' | 'published' | 'stale' | 'demoted';
export type WarningTier = 'advisory' | 'alert' | 'red';
export type ReportState = 'submitted' | 'ai_screened' | 'fixer_review' | 'published' | 'rejected';

export interface Province {
  id: string;
  slug: string;
  displayName: {
    persona: { en: string; vi: string };
    admin: { en: string; vi: string };
  };
  personaArchetype: { en: string; vi: string };
  accentColor: string;
  qualityScore: number;
  legacyAdminNote?: { en: string; vi: string };
}

export interface VerifiedFact {
  id: string;
  provinceId: string;
  body: { en: string; vi: string };
  category: FactCategory;
  state: FactState;
  verifiedAt?: string;
  expiresAt?: string;
  sourceUrl?: string;
  fixerSignatureId?: string;
}

export interface FixerSignature {
  id: string;
  fixerHandle: string;
  fixerFullName: string;
  signedAt: string;
  verificationTripId: string;
}

export interface ScamWarning {
  id: string;
  provinceId: string;
  title: { en: string; vi: string };
  body: { en: string; vi: string };
  tier: WarningTier;
  publishedAt: string;
}

/**
 * Citation payload streamed over SSE alongside chat tokens.
 * See 02-SPECS/trust-citation-rendering.md §payload contract.
 */
export interface CitationPayload {
  factId: string;
  body: string;
  category: FactCategory;
  fixer: { handle: string; fullName: string; signedAt: string };
  verifiedAt: string;
  isStale: boolean;
  sourceUrl?: string;
}

/**
 * 3-tier LLM router classification result.
 * See 03-DECISIONS/0002-rag-and-persona-architecture.md §LLM routing.
 */
export type LlmTier = 1 | 2 | 3;
