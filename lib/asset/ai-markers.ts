/**
 * Known AI-image-generation markers we reject at upload time.
 * Updated as new generators ship. PRs welcome — see docs/NO_AI_IMAGERY.md.
 *
 * Detection strategy: any image whose EXIF, XMP, or PNG text chunks contain
 * any of these substrings (case-insensitive) is rejected at /api/asset/upload.
 */

export const AI_MARKER_STRINGS = [
  // Major generators (substring match on metadata)
  'Stable Diffusion',
  'StableDiffusion',
  'Midjourney',
  'DALL·E',
  'DALL-E',
  'dalle',
  'Imagen',
  'Adobe Firefly',
  'Firefly',
  'Leonardo',
  'Bing Image Creator',
  'Microsoft Designer',
  'NovelAI',
  'PlaygroundAI',
  'Playground v2',
  'Flux',
  'FLUX.1',
  'Ideogram',
  'Recraft',
  'Krea',
  'Sora',
  'Runway',
  'RunwayML',
  // Comfy / Auto1111 workflow metadata
  'ComfyUI',
  'AUTOMATIC1111',
  'a1111',
  'sd-webui',
  'invoke-ai',
  'InvokeAI',
  // Common workflow keys
  'workflow',
  'parameters',
  'positive_prompt',
  'negative_prompt',
  // Authenticity (C2PA) tags that indicate AI provenance
  'c2pa.actions/c2pa.created.ai',
  'c2pa.ai_generative',
] as const;

export type ExifFinding = {
  marker: string;
  source: 'exif' | 'xmp' | 'pngText' | 'iptc';
  context?: string;
};

export const findAiMarkers = (rawText: string): ExifFinding[] => {
  if (!rawText) return [];
  const lower = rawText.toLowerCase();
  const found: ExifFinding[] = [];
  for (const marker of AI_MARKER_STRINGS) {
    if (lower.includes(marker.toLowerCase())) {
      found.push({ marker, source: 'exif' });
    }
  }
  return found;
};
