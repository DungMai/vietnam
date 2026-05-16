/**
 * Checkpoint 4 — CI guard for no-AI-imagery (docs/NO_AI_IMAGERY.md).
 *
 * Scans every image under `public/` for AI-generation markers in its
 * EXIF / XMP / PNG-text metadata. Fails the build if any marker is found.
 *
 * Add as a step in .github/workflows/ci.yml (Stage 4 deeper TODO).
 * Run locally:  pnpm tsx scripts/scan-assets-ci.ts
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { checkExif } from '../lib/asset/exif';

const ROOTS = ['public']; // extend with more dirs if needed
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic']);

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) await walk(p, out);
    else if (IMAGE_EXTS.has(extname(name).toLowerCase())) out.push(p);
  }
  return out;
}

async function main() {
  let failed = 0;
  let scanned = 0;

  for (const root of ROOTS) {
    const files = await walk(root);
    for (const f of files) {
      scanned++;
      const buf = new Uint8Array(readFileSync(f));
      const result = await checkExif(buf);
      if (!result.passed && result.findings.some((x) => x.marker !== 'no_exif_data')) {
        // 'no_exif_data' alone is suspicious but not auto-fail at CI level —
        // checkpoint 3 (fixer review) catches the genuinely-AI ones.
        console.error(`::error file=${f}::AI-marker found in metadata: ${result.findings.map((x) => x.marker).join(', ')}`);
        failed++;
      }
    }
  }

  console.log(`Scanned ${scanned} images. ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
