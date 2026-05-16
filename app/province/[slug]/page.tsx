import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { resolveLocale, pickLocale } from '@/lib/i18n/locale';
import { QualityChip } from '@/components/QualityChip';
import { ScamWarningCard } from '@/components/ScamWarningCard';
import type { Locale, WarningTier } from '@/types/domain';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ lang?: string }>;

export default async function ProvincePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const locale: Locale = resolveLocale((await searchParams).lang);
  const supabase = await supabaseServer();

  const { data: p } = await supabase
    .from('province')
    .select('*, scam_warning(id, title_en, title_vi, body_en, body_vi, tier, published_at)')
    .eq('slug', slug)
    .maybeSingle();

  if (!p) notFound();

  const personaName = pickLocale(
    { en: p.display_name_persona_en, vi: p.display_name_persona_vi },
    locale,
  );
  const archetype = pickLocale(
    { en: p.persona_archetype_en, vi: p.persona_archetype_vi },
    locale,
  );

  // active warnings only
  const warnings = (p.scam_warning ?? []).filter((w: { published_at?: string | null }) => !!w.published_at);

  return (
    <div className="space-y-8">
      <section
        className="rounded-lg border-l-4 p-6"
        style={{ borderColor: p.accent_color, backgroundColor: `${p.accent_color}0F` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-h1">{personaName}</h1>
            <p className="mt-1 text-body-sm text-ink-secondary">{archetype}</p>
          </div>
          <QualityChip score={p.quality_score_cached} locale={locale} />
        </div>
        <a
          href={`/province/${slug}/chat?lang=${locale}`}
          className="mt-4 inline-flex items-center rounded-md bg-ink-primary px-4 py-2 text-body-sm text-surface-base hover:opacity-90"
        >
          {locale === 'vi' ? `Nói chuyện với ${personaName}` : `Talk to ${personaName}`}
        </a>
      </section>

      {warnings.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-h3 font-semibold">
            {locale === 'vi' ? 'Cảnh báo lừa đảo đang còn' : 'Active scam watch'}
          </h2>
          {warnings.map((w: {
            id: string;
            tier: WarningTier;
            title_en: string;
            title_vi: string;
            body_en: string;
            body_vi: string;
          }) => (
            <ScamWarningCard
              key={w.id}
              tier={w.tier}
              title={pickLocale({ en: w.title_en, vi: w.title_vi }, locale)}
              body={pickLocale({ en: w.body_en, vi: w.body_vi }, locale)}
            />
          ))}
        </section>
      )}

      {p.legacy_admin_note_en && (
        <section className="rounded-md border border-ink-secondary/10 bg-surface-raised p-4 text-caption text-ink-secondary">
          {pickLocale({ en: p.legacy_admin_note_en, vi: p.legacy_admin_note_vi }, locale)}
        </section>
      )}
    </div>
  );
}
