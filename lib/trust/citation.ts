import type { CitationPayload, VerifiedFact, FixerSignature } from '@/types/domain';

/**
 * Assemble the citation payload streamed alongside chat tokens.
 * See 02-SPECS/trust-citation-rendering.md §payload contract.
 */
export const buildCitation = (
  fact: VerifiedFact,
  signature: FixerSignature,
  locale: 'en' | 'vi',
): CitationPayload => {
  const verifiedAt = fact.verifiedAt ?? signature.signedAt;
  const isStale = fact.expiresAt
    ? new Date(fact.expiresAt).getTime() < Date.now()
    : false;

  return {
    factId: fact.id,
    body: fact.body[locale],
    category: fact.category,
    fixer: {
      handle: signature.fixerHandle,
      fullName: signature.fixerFullName,
      signedAt: signature.signedAt,
    },
    verifiedAt,
    isStale,
    sourceUrl: fact.sourceUrl,
  };
};

/**
 * Format the inline citation phrasing (narrative-voice-deck.md §3).
 */
export const formatCitationLine = (
  c: CitationPayload,
  locale: 'en' | 'vi',
): string => {
  const date = new Date(c.verifiedAt).toLocaleDateString(
    locale === 'vi' ? 'vi-VN' : 'en-US',
    { month: 'short', year: 'numeric' },
  );
  return locale === 'vi'
    ? `Xác minh bởi ${c.fixer.fullName} — fixer địa phương — ${date}`
    : `Verified by ${c.fixer.fullName} — local fixer — ${date}`;
};
