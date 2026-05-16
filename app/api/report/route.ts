import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const ReportSchema = z.object({
  provinceId: z.string().uuid(),
  body: z.string().min(20).max(2000),
  bodyLang: z.enum(['en', 'vi']),
  sessionId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const parsed = ReportSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('community_report')
    .insert({
      province_id: parsed.data.provinceId,
      body: parsed.data.body,
      body_lang: parsed.data.bodyLang,
      session_id: parsed.data.sessionId,
      state: 'submitted',
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // TODO Stage 4: enqueue AI pre-screen, then fixer review queue.
  return NextResponse.json({ id: data.id, status: 'submitted' }, { status: 201 });
}
