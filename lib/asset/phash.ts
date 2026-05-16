/**
 * pHash (perceptual hash) similarity check — checkpoint 2 of the no-AI-imagery pipeline.
 * See docs/NO_AI_IMAGERY.md §4-checkpoint enforcement.
 *
 * Strategy: maintain a small reference corpus of known AI-generated images
 * (Midjourney showcase, Stable Diffusion samples, AI image banks). Compute
 * pHash of incoming uploads and compare to corpus via Hamming distance.
 * Reject if distance to any corpus member is below threshold (typical: 6
 * of 64 bits ≈ 90% perceptual similarity).
 *
 * Status: STUB — not yet implemented. EXIF check (checkpoint 1) and fixer
 * manual review (checkpoint 3) handle the load until this is wired.
 *
 * Implementation plan:
 *   1. Use sharp + a pHash JS lib (e.g. `phash-image`, `blockhash-core`)
 *   2. Store reference corpus pHashes in a `ai_image_phash_corpus` table
 *   3. Compare on every upload; reject if min distance <= 6
 *   4. Allow contributors to expand corpus via fact-correction issues
 *
 * Until implemented, this function returns { passed: true, distance_min: null }
 * to not block the upload pipeline. Fixer review (checkpoint 3) remains the
 * binding gate.
 */

export interface PhashCheckResult {
  passed: boolean;
  distanceMin: number | null;
  /** Whether the check actually ran or returned a stub pass. */
  isStub: boolean;
}

export const checkPhash = async (_buffer: Uint8Array): Promise<PhashCheckResult> => {
  // TODO: implement. See note above.
  return { passed: true, distanceMin: null, isStub: true };
};
