'use client';

import { useEffect } from 'react';
import type { CitationPayload, Locale } from '@/types/domain';
import { formatCitationLine } from '@/lib/trust/citation';

interface Props {
  citation: CitationPayload;
  locale: Locale;
  onClose: () => void;
}

export const CitationModal = ({ citation, locale, onClose }: Props) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const cat = citation.category;
  const catLabel = locale === 'vi'
    ? { price: 'Giá', hours: 'Giờ', location: 'Địa điểm', scam_pattern: 'Chiêu lừa', culture: 'Văn hoá', history: 'Lịch sử', logistics: 'Di chuyển', other: 'Khác' }[cat]
    : { price: 'Price', hours: 'Hours', location: 'Location', scam_pattern: 'Scam', culture: 'Culture', history: 'History', logistics: 'Logistics', other: 'Other' }[cat];

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-ink-primary/40 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg rounded-t-lg bg-surface-raised p-6 shadow-overlay sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-caption font-medium uppercase tracking-wide text-ink-secondary">
            {catLabel}
          </span>
          <button onClick={onClose} className="text-ink-secondary hover:text-ink-primary" aria-label="Close">
            ✕
          </button>
        </div>

        <p className="text-body">{citation.body}</p>

        <hr className="my-4 border-ink-secondary/10" />

        <div className="space-y-1 text-caption text-ink-secondary">
          <div className={citation.isStale ? 'text-warn-alert' : 'text-trust-verified'}>
            ✓ {formatCitationLine(citation, locale)}
            {citation.isStale && (
              <span className="ml-1">
                · {locale === 'vi' ? 'có thể đã cũ' : 'possibly stale'}
              </span>
            )}
          </div>
          {citation.sourceUrl && (
            <a href={citation.sourceUrl} target="_blank" rel="noreferrer" className="underline">
              {locale === 'vi' ? 'Nguồn' : 'Source'}
            </a>
          )}
        </div>

        <button
          type="button"
          className="mt-4 text-caption text-ink-secondary underline"
          // TODO: wire to /api/report with prefill that this fact looks outdated
        >
          {locale === 'vi' ? 'Báo dữ kiện đã lỗi thời' : 'Report this fact as outdated'}
        </button>
      </div>
    </div>
  );
};
