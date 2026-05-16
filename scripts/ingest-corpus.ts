/**
 * Ingest verified_fact rows into corpus_chunk with Gemini embeddings.
 *
 * Run after `pnpm db:seed`:
 *   pnpm tsx scripts/ingest-corpus.ts
 *
 * Embeds each published fact in both EN and VI, inserts as `corpus_chunk` rows
 * with lang discriminator (per migration 0003 §corpus_chunk exception note).
 *
 * Idempotent: skips facts whose chunks already exist for that lang.
 */
import { createClient } from '@supabase/supabase-js';
import { embedBatch } from '../lib/rag/embed';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function existingChunkSourceIds(lang: 'en' | 'vi'): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('corpus_chunk')
    .select('source_id')
    .eq('doc_type', 'verified_fact')
    .eq('lang', lang);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.source_id).filter((x): x is string => !!x));
}

async function ingestLang(lang: 'en' | 'vi') {
  const { data: facts, error } = await supabase
    .from('verified_fact')
    .select('id, province_id, body_en, body_vi')
    .eq('state', 'published');
  if (error) throw error;
  if (!facts || facts.length === 0) {
    console.log(`[${lang}] no published facts`);
    return;
  }

  const already = await existingChunkSourceIds(lang);
  const fresh = facts.filter((f) => !already.has(f.id));
  if (fresh.length === 0) {
    console.log(`[${lang}] all ${facts.length} facts already embedded`);
    return;
  }

  const texts = fresh.map((f) => (lang === 'vi' ? f.body_vi : f.body_en));
  console.log(`[${lang}] embedding ${fresh.length} facts...`);
  const embeddings = await embedBatch(texts);

  const rows = fresh.map((f, i) => ({
    province_id: f.province_id,
    lang,
    doc_type: 'verified_fact',
    source_id: f.id,
    body: texts[i],
    embedding: embeddings[i],
  }));

  const { error: insertErr } = await supabase.from('corpus_chunk').insert(rows);
  if (insertErr) throw insertErr;
  console.log(`[${lang}] inserted ${rows.length} corpus chunks`);
}

async function main() {
  await ingestLang('en');
  await ingestLang('vi');

  // Refresh cached quality scores
  const { data: provs } = await supabase.from('province').select('id, slug');
  for (const p of provs ?? []) {
    const { data: q } = await supabase
      .from('province_quality_score')
      .select('score')
      .eq('province_id', p.id)
      .maybeSingle();
    await supabase
      .from('province')
      .update({ quality_score_cached: q?.score ?? 0 })
      .eq('id', p.id);
  }
  console.log('quality scores refreshed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
