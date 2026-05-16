import exifr from 'exifr';
import { findAiMarkers, type ExifFinding } from './ai-markers';

export interface ExifCheckResult {
  passed: boolean;
  findings: ExifFinding[];
  cameraMake?: string;
  cameraModel?: string;
  software?: string;
  captureDate?: string;
}

/**
 * EXIF allowlist check — checkpoint 1 of the no-AI-imagery pipeline.
 * See docs/NO_AI_IMAGERY.md §4-checkpoint enforcement.
 *
 * Rejects:
 *   - Any image whose metadata contains an AI-generation marker string
 *   - Images with no EXIF / no camera signature at all (likely re-encoded
 *     to strip AI metadata) — flagged for fixer manual review, not auto-reject
 *
 * Note: stripping EXIF doesn't bypass this — checkpoint 2 (pHash) and
 * checkpoint 3 (fixer review) catch what EXIF stripping evades.
 */
export const checkExif = async (buffer: Uint8Array): Promise<ExifCheckResult> => {
  let parsed: Record<string, unknown> | undefined;
  try {
    parsed = await exifr.parse(buffer, {
      tiff: true,
      exif: true,
      gps: false,           // privacy: don't read user GPS
      xmp: true,
      iptc: true,
      icc: false,
      jfif: true,
      ihdr: true,
      // include extra fields for AI-generator workflow metadata
      mergeOutput: true,
    });
  } catch (e) {
    return {
      passed: false,
      findings: [{ marker: 'exif_parse_error', source: 'exif', context: String(e) }],
    };
  }

  if (!parsed) {
    // No EXIF at all — suspicious for a "real photo" claim.
    return {
      passed: false,
      findings: [{ marker: 'no_exif_data', source: 'exif' }],
    };
  }

  const haystack = JSON.stringify(parsed);
  const findings = findAiMarkers(haystack);

  return {
    passed: findings.length === 0,
    findings,
    cameraMake: typeof parsed.Make === 'string' ? parsed.Make : undefined,
    cameraModel: typeof parsed.Model === 'string' ? parsed.Model : undefined,
    software: typeof parsed.Software === 'string' ? parsed.Software : undefined,
    captureDate:
      parsed.DateTimeOriginal instanceof Date
        ? parsed.DateTimeOriginal.toISOString().slice(0, 10)
        : undefined,
  };
};
