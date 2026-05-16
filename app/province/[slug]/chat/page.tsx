import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { resolveLocale, pickLocale } from '@/lib/i18n/locale';
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

  // TODO Stage 4: replace this stub with a client component wired to
  //   /api/chat SSE stream (see 02-SPECS/trust-citation-rendering.md §SSE).
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-h2">
        {locale === 'vi' ? `Chat với ${personaName}` : `Chat with ${personaName}`}
      </h1>
      <div className="rounded-lg border border-ink-secondary/10 bg-surface-raised p-6 text-body-sm text-ink-secondary">
        {locale === 'vi'
          ? 'Khung chat sẽ được nối với /api/chat (SSE streaming) trong giai đoạn build.'
          : 'Chat surface will wire to /api/chat (SSE streaming) at build phase.'}
      </div>
    </div>
  );
}
