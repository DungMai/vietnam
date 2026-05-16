'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Locale } from '@/types/domain';

export const BilingualToggle = () => {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const current: Locale = params.get('lang') === 'vi' ? 'vi' : 'en';

  const swap = (lang: Locale) => {
    const next = new URLSearchParams(params.toString());
    next.set('lang', lang);
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="inline-flex rounded-pill border border-ink-secondary/15 bg-surface-raised p-0.5 text-caption">
      <button
        type="button"
        onClick={() => swap('en')}
        className={`rounded-pill px-2.5 py-1 transition ${
          current === 'en' ? 'bg-ink-primary text-surface-base' : 'text-ink-secondary'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => swap('vi')}
        className={`rounded-pill px-2.5 py-1 transition ${
          current === 'vi' ? 'bg-ink-primary text-surface-base' : 'text-ink-secondary'
        }`}
      >
        VI
      </button>
    </div>
  );
};
