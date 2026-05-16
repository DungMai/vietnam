import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { resolveLocale, pickLocale } from '@/lib/i18n/locale';
import { ChatSurface } from '@/components/ChatSurface';
import type { Locale } from '@/types/domain';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ lang?: string }>;

export default async function ChatPage({
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
    .select('id, slug, display_name_persona_en, display_name_persona_vi, accent_color')
    .eq('slug', slug)
    .maybeSingle();

  if (!p) notFound();

  const personaName = pickLocale(
    { en: p.display_name_persona_en, vi: p.display_name_persona_vi },
    locale,
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <div className="h-6 w-1 rounded-pill" style={{ background: p.accent_color }} aria-hidden />
        <h1 className="font-serif text-h2">
          {locale === 'vi' ? `Chat với ${personaName}` : `Chat with ${personaName}`}
        </h1>
      </header>
      <ChatSurface
        provinceSlug={p.slug}
        personaName={personaName}
        accentColor={p.accent_color}
        locale={locale}
      />
    </div>
  );
}
