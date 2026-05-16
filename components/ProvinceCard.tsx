import Link from 'next/link';
import type { Province, Locale } from '@/types/domain';
import { QualityChip } from './QualityChip';

interface Props {
  province: Province;
  locale: Locale;
}

export const ProvinceCard = ({ province, locale }: Props) => {
  const personaName = province.displayName.persona[locale];
  const archetype = province.personaArchetype[locale];

  return (
    <Link
      href={`/province/${province.slug}?lang=${locale}`}
      className="group block rounded-lg border border-ink-secondary/10 bg-surface-raised p-5 shadow-raised transition hover:-translate-y-0.5 hover:shadow-floating"
    >
      <div
        className="mb-4 h-1 rounded-pill"
        style={{ backgroundColor: province.accentColor }}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-h3">{personaName}</h3>
          <p className="mt-1 text-caption text-ink-secondary">{archetype}</p>
        </div>
        <QualityChip score={province.qualityScore} locale={locale} compact />
      </div>
    </Link>
  );
};
