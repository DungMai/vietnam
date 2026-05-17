import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkExif } from '@/lib/asset/exif';
import { checkPhash } from '@/lib/asset/phash';
import { getOrCreateSession } from '@/lib/session/cookie';

export const runtime = 'nodejs';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/webp']);
const MAX_BYTES = 12 * 1024 * 1024; // 12 MB

const FieldsSchema = z.object({
  provinceId: z.string().uuid(),
  provenanceKind: z.enum(['fixer_camera', 'licensed_photographer', 'user_attestation']),
  photographerName: z.string().min(1).max(120).optional(),
  photographerCreditUrl: z.string().url().optional(),
  captionEn: z.string().min(1).max(400).optional(),
  captionVi: z.string().min(1).max(400).optional(),
});

/**
 * POST /api/asset/upload — multipart/form-data
 * fields:
 *   file: File (jpeg/png/heic/webp, ≤12MB)
 *   provinceId, provenanceKind, photographerName, photographerCreditUrl,
 *   captionEn, captionVi (paired or both null)
 *
 * Pipeline (docs/NO_AI_IMAGERY.md §4-checkpoint enforcement):
 *   1. EXIF + AI-marker scan (rejects at upload)
 *   2. pHash similarity vs known-AI corpus (stub for now)
 *   3. Manual fixer review (DB state, fixers act externally)
 *   4. CI scan on committed assets (workflow)
 *
 * On AI-marker hit: stored as 'rejected' with findings logged; user gets 422.
 * On clean pass: stored as 'auto_screened', queued for fixer review.
 * Never auto-publishes — checkpoint 3 (fixer signature) is the gate.
 */
export async function POST(req: NextRequest) {
  const session = await getOrCreateSession();

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'expected multipart/form-data' }, { status: 400 });

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file field required' }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'unsupported mime', mime: file.type }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'file too large', maxBytes: MAX_BYTES }, { status: 413 });
  }

  const fields = FieldsSchema.safeParse({
    provinceId: form.get('provinceId'),
    provenanceKind: form.get('provenanceKind'),
    photographerName: form.get('photographerName') || undefined,
    photographerCreditUrl: form.get('photographerCreditUrl') || undefined,
    captionEn: form.get('captionEn') || undefined,
    captionVi: form.get('captionVi') || undefined,
  });
  if (!fields.success) {
    return NextResponse.json({ error: 'invalid fields', issues: fields.error.issues }, { status: 400 });
  }
  // bilingual caption rule
  const hasEn = !!fields.data.captionEn;
  const hasVi = !!fields.data.captionVi;
  if (hasEn !== hasVi) {
    return NextResponse.json(
      { error: 'caption must be bilingual: both EN and VI, or neither' },
      { status: 400 },
    );
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const sha256 = createHash('sha256').update(buffer).digest('hex');

  // === Checkpoint 1 — EXIF + AI-marker ===
  const exif = await checkExif(buffer);

  // === Checkpoint 2 — pHash (currently stub; see lib/asset/phash.ts) ===
  const phash = await checkPhash(buffer);

  const supabase = supabaseAdmin();

  // Compute initial state from checks
  const rejected = !exif.passed;
  const initialState: 'rejected' | 'auto_screened' = rejected ? 'rejected' : 'auto_screened';
  const rejectionReason = rejected
    ? `EXIF/AI-marker check failed: ${exif.findings.map((f) => f.marker).join(', ')}`
    : null;

  // Generate R2 key (storage upload itself is handled out-of-band by a worker;
  // for the scaffold we store the intended key and let a worker pick it up).
  const r2Key = `assets/${fields.data.provinceId}/${sha256.slice(0, 2)}/${sha256}.${mimeToExt(file.type)}`;

  const { data, error } = await supabase
    .from('asset')
    .insert({
      province_id: fields.data.provinceId,
      r2_key: r2Key,
      sha256,
      mime_type: file.type,
      size_bytes: file.size,
      provenance_kind: fields.data.provenanceKind,
      photographer_name: fields.data.photographerName ?? null,
      photographer_credit_url: fields.data.photographerCreditUrl ?? null,
      capture_date: exif.captureDate ?? null,
      caption_en: fields.data.captionEn ?? null,
      caption_vi: fields.data.captionVi ?? null,
      exif_check_passed: exif.passed,
      exif_check_findings: exif.findings.length > 0 ? exif.findings : null,
      phash_check_passed: phash.passed,
      phash_distance_min: phash.distanceMin,
      state: initialState,
      rejection_reason: rejectionReason,
      uploaded_by_session: session.id,
    })
    .select('id, state, rejection_reason')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // TODO Stage 4 deeper: hand off `buffer` to an R2 upload worker.
  // For the scaffold we only persist intent; the worker watches the DB.

  return NextResponse.json(
    {
      id: data.id,
      state: data.state,
      rejection_reason: data.rejection_reason,
      r2_key: r2Key,
      checkpoints: {
        exif: { passed: exif.passed, findings: exif.findings },
        phash: { passed: phash.passed, isStub: phash.isStub },
        fixer_review: 'pending',
        ci_scan: 'pending',
      },
    },
    { status: rejected ? 422 : 202 },
  );
}

const mimeToExt = (mime: string): string => {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/heic':
      return 'heic';
    case 'image/webp':
      return 'webp';
    default:
      return 'bin';
  }
};
