import type { CitationPayload, Locale } from '@/types/domain';
import { formatCitationLine } from '@/lib/trust/citation';

interface Props {
  citation: CitationPayload;
  locale: Locale;
}

export const CitationPill = ({ citation, locale }: Props) => {
  const stale = citation.isStale;
  return (
    <button
      type="button"
      className={`verified-pill ${stale ? 'opacity-60 grayscale' : ''}`}
      aria-label={formatCitationLine(citation, locale)}
      // TODO Stage 4: open <CitationModal> with full payload + "report outdated" CTA
    >
      <span aria-hidden>✓</span>
      <span>
        {stale
          ? locale === 'vi'
            ? 'Đã xác minh — có thể đã cũ'
            : 'Verified — possibly stale'
          : locale === 'vi'
            ? `Xác minh bởi ${citation.fixer.fullName}`
            : `Verified by ${citation.fixer.fullName}`}
      </span>
    </button>
  );
};
