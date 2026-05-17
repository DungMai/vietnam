import type { CitationPayload, VerifiedFact, FixerSignature } from '@/types/domain';

/**
 * Assemble the citation payload streamed alongside chat tokens.
 * See 02-SPECS/trust-citation-rendering.md §payload contract.
 */
export const buildCitation = (
  fact: VerifiedFact,
  signature: FixerSignature | null,
  locale: 'en' | 'vi',
): CitationPayload => {
  const verifiedAt = fact.verifiedAt ?? signature?.signedAt;
  const isStale = fact.expiresAt
    ? new Date(fact.expiresAt).getTime() < Date.now()
    : false;
  const tier = signature
    ? isStale
      ? 'recent_source'
      : 'verified_local'
    : 'ai_inferred';

  return {
    factId: fact.id,
    body: fact.body[locale],
    category: fact.category,
    tier,
    fixer: signature
      ? {
          handle: signature.fixerHandle,
          fullName: signature.fixerFullName,
          signedAt: signature.signedAt,
        }
      : undefined,
    verifiedAt,
    isStale,
    sourceUrl: fact.sourceUrl,
  };
};

/**
 * Format the inline citation phrasing (narrative-voice-deck.md §3).
 * Tier-aware: ai_inferred citations have no fixer + no verified date.
 */
export const formatCitationLine = (
  c: CitationPayload,
  locale: 'en' | 'vi',
): string => {
  if (c.tier === 'ai_inferred' || !c.fixer || !c.verifiedAt) {
    return locale === 'vi'
      ? 'AI suy luận từ nguồn công khai — chưa được fixer xác minh'
      : 'AI inferred from a public source — not yet fixer-verified';
  }
  const date = new Date(c.verifiedAt).toLocaleDateString(
    locale === 'vi' ? 'vi-VN' : 'en-US',
    { month: 'short', year: 'numeric' },
  );
  if (c.tier === 'recent_source') {
    return locale === 'vi'
      ? `Nguồn từ ${c.fixer.fullName} (${date}) — có thể đã cũ, hãy kiểm chứng lại`
      : `Source from ${c.fixer.fullName} (${date}) — possibly stale, double-check`;
  }
  return locale === 'vi'
    ? `Xác minh bởi ${c.fixer.fullName} — fixer địa phương — ${date}`
    : `Verified by ${c.fixer.fullName} — local fixer — ${date}`;
};
