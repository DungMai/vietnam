import type { WarningTier } from '@/types/domain';

interface Props {
  tier: WarningTier;
  title: string;
  body: string;
}

const tierStyle: Record<WarningTier, { surface: string; border: string; text: string; label: string }> = {
  advisory: {
    surface: 'bg-warn-advisory/10',
    border: 'border-warn-advisory/40',
    text: 'text-warn-advisory',
    label: 'Advisory',
  },
  alert: {
    surface: 'bg-warn-alert/15',
    border: 'border-warn-alert/50',
    text: 'text-warn-alert',
    label: 'Alert',
  },
  red: {
    surface: 'bg-warn-red/15',
    border: 'border-warn-red/60',
    text: 'text-warn-red',
    label: 'Red alert',
  },
};

export const ScamWarningCard = ({ tier, title, body }: Props) => {
  const s = tierStyle[tier];
  return (
    <article className={`rounded-md border ${s.border} ${s.surface} p-4`}>
      <div className={`mb-2 inline-flex items-center gap-2 text-caption font-semibold uppercase tracking-wide ${s.text}`}>
        <span aria-hidden>⚠</span>
        {s.label}
      </div>
      <h3 className="text-body font-semibold">{title}</h3>
      <p className="mt-2 text-body-sm text-ink-primary/90">{body}</p>
    </article>
  );
};
