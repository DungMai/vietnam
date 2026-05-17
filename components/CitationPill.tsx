import type { CitationPayload, CitationTier, Locale } from '@/types/domain';
import { formatCitationLine } from '@/lib/trust/citation';

interface Props {
  citation: CitationPayload;
  locale: Locale;
}

const tierStyle: Record<CitationTier, { className: string; glyph: string }> = {
  verified_local: { className: 'verified-pill', glyph: '✓' },
  recent_source: { className: 'verified-pill border-warn-alert text-warn-alert', glyph: '◷' },
  ai_inferred: { className: 'verified-pill border-dashed border-ink-secondary/60 text-ink-secondary', glyph: '~' },
};

const tierLabel = (tier: CitationTier, locale: Locale, citation: CitationPayload): string => {
  if (tier === 'verified_local') {
    return citation.fixer
      ? locale === 'vi'
        ? `Xác minh tại chỗ — ${citation.fixer.fullName}`
        : `Verified local — ${citation.fixer.fullName}`
      : locale === 'vi'
        ? 'Xác minh tại chỗ'
        : 'Verified local';
  }
  if (tier === 'recent_source') {
    return locale === 'vi' ? 'Nguồn gần đây — có thể đã cũ' : 'Recent source — possibly stale';
  }
  return locale === 'vi' ? 'AI suy luận — chưa xác minh' : 'AI inferred — unverified';
};

export const CitationPill = ({ citation, locale }: Props) => {
  const style = tierStyle[citation.tier] ?? tierStyle.ai_inferred;
  return (
    <button
      type="button"
      className={style.className}
      aria-label={formatCitationLine(citation, locale)}
    >
      <span aria-hidden>{style.glyph}</span>
      <span>{tierLabel(citation.tier, locale, citation)}</span>
    </button>
  );
};
