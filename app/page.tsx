import { supabaseServer } from '@/lib/supabase/server';
import { resolveLocale } from '@/lib/i18n/locale';
import { ProvinceCard } from '@/components/ProvinceCard';
import type { Province, Locale } from '@/types/domain';

export const revalidate = 60;

type SearchParams = Promise<{ lang?: string }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const locale: Locale = resolveLocale((await searchParams).lang);
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from('province')
    .select(
      'id, slug, display_name_persona_en, display_name_persona_vi, display_name_admin_en, display_name_admin_vi, persona_archetype_en, persona_archetype_vi, accent_color, quality_score_cached',
    )
    .order('quality_score_cached', { ascending: false });

  if (error) {
    return (
      <div className="rounded-md bg-feedback-error/10 p-4 text-feedback-error">
        Failed to load provinces: {error.message}
      </div>
    );
  }

  const provinces: Province[] = (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    displayName: {
      persona: { en: row.display_name_persona_en, vi: row.display_name_persona_vi },
      admin: { en: row.display_name_admin_en, vi: row.display_name_admin_vi },
    },
    personaArchetype: {
      en: row.persona_archetype_en,
      vi: row.persona_archetype_vi,
    },
    accentColor: row.accent_color,
    qualityScore: row.quality_score_cached,
  }));

  const heroCopy = {
    en: {
      title: 'Ten provinces. Ten AIs that actually know.',
      sub: 'Fixer-verified local answers. Scam-aware. No AI imagery, ever.',
    },
    vi: {
      title: 'Mười tỉnh. Mười AI thực sự hiểu nơi đó.',
      sub: 'Câu trả lời địa phương được fixer xác minh. Cảnh báo lừa đảo. Không bao giờ dùng ảnh AI.',
    },
  };

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="font-serif text-display tracking-tight">{heroCopy[locale].title}</h1>
        <p className="text-body-sm text-ink-secondary">{heroCopy[locale].sub}</p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {provinces.map((p) => (
          <ProvinceCard key={p.id} province={p} locale={locale} />
        ))}
      </section>
    </div>
  );
}
