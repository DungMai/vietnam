import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { resolveLocale } from '@/lib/i18n/locale';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const factId = searchParams.get('factId');
  const locale = resolveLocale(searchParams.get('lang'));

  if (!factId) {
    return NextResponse.json({ error: 'factId required' }, { status: 400 });
  }

  const supabase = await supabaseServer();
  const { data: fact, error } = await supabase
    .from('verified_fact')
    .select('id, body_en, body_vi, category, verified_at, expires_at, source_url, fixer_signature_id')
    .eq('id', factId)
    .eq('state', 'published')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!fact) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // TODO Stage 4: join fixer_signature → fixer for full attribution payload.
  return NextResponse.json({
    factId: fact.id,
    body: locale === 'vi' ? fact.body_vi : fact.body_en,
    category: fact.category,
    verifiedAt: fact.verified_at,
    isStale: fact.expires_at ? new Date(fact.expires_at).getTime() < Date.now() : false,
    sourceUrl: fact.source_url,
  });
}
