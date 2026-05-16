import type { Locale } from '@/types/domain';

interface Props {
  score: number;
  locale: Locale;
  compact?: boolean;
}

const trustHue = (score: number) => {
  if (score >= 70) return 'text-trust-verified';
  if (score >= 40) return 'text-warn-alert';
  return 'text-trust-unverified';
};

export const QualityChip = ({ score, locale, compact = false }: Props) => {
  const label = locale === 'vi' ? 'Xác minh tại chỗ' : 'Verified Local';
  return (
    <button
      type="button"
      className={`quality-chip ${trustHue(score)}`}
      // TODO Stage 4: open S-quality explainer modal ("Why N%?")
      aria-label={`${label}: ${score}%`}
    >
      <span className="font-mono">{score}%</span>
      {!compact && <span className="text-ink-secondary">· {label}</span>}
    </button>
  );
};
