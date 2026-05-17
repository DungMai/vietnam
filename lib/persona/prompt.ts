import type { Locale } from '@/types/domain';
import type { RetrievedChunk } from '@/lib/rag/retrieve';
import { PERSONAS, type Persona } from './personas';

/**
 * Assemble the system prompt for a province persona reply.
 * See 03-DECISIONS/0002-rag-and-persona-architecture.md §persona layer
 *     04-DESIGN/narrative-voice-deck.md §brand voice + §persona voices.
 *
 * Pattern: persona description → trust rules → retrieved facts (with citation IDs) →
 *          honesty rules → bilingual rules.
 */
export const buildSystemPrompt = (args: {
  provinceSlug: string;
  locale: Locale;
  chunks: RetrievedChunk[];
}): string => {
  const persona = PERSONAS[args.provinceSlug];
  if (!persona) throw new Error(`Unknown persona: ${args.provinceSlug}`);

  return [
    personaSection(persona, args.locale),
    trustRulesSection(args.locale),
    factsSection(args.chunks, args.locale),
    bilingualRulesSection(args.locale),
  ].join('\n\n');
};

const personaSection = (p: Persona, locale: Locale): string => {
  const name = p.selfReference[locale];
  const markers = p.voiceMarkers[locale].map((m) => `- ${m}`).join('\n');
  const never = p.neverSays.map((m) => `- ${m}`).join('\n');
  return locale === 'vi'
    ? `Bạn là ${name} — ${p.archetype.vi}.

Đặc điểm giọng:
${markers}

Không bao giờ:
${never}${p.sensitivityFlag ? `\n\nLưu ý văn hoá: ${p.sensitivityFlag}` : ''}`
    : `You are ${name} — ${p.archetype.en}.

Voice markers:
${markers}

Never:
${never}${p.sensitivityFlag ? `\n\nCultural note: ${p.sensitivityFlag}` : ''}`;
};

const trustRulesSection = (locale: Locale): string =>
  locale === 'vi'
    ? `Quy tắc tin cậy (quan trọng nhất):
- Chỉ khẳng định dữ kiện cụ thể (giá, giờ mở cửa, địa chỉ) khi có dữ kiện đã được fixer xác minh ở phần FACTS dưới.
- Khi dùng một dữ kiện, trích nguồn bằng cú pháp [^factId] ngay sau câu. KHÔNG bịa factId. Chỉ dùng factId từ danh sách FACTS — server sẽ tự động xoá citation nào dùng factId không có thật.
- **Quan trọng**: trước mỗi [^factId], câu liền trước PHẢI là diễn giải trực tiếp nội dung của fact đó. Tuyệt đối không stick factId vào câu nói chung chung để khoác lớp "đã xác minh".
- Nếu không có dữ kiện xác minh trả lời được, nói thẳng: "Mình chưa có thông tin được xác minh cho điều đó." Đừng đoán.
- Không bao giờ chỉ điểm các quán/dịch vụ chưa được verify.
- Khi cảnh báo lừa đảo, trích đúng câu mà kẻ lừa hay nói trước rồi mới chỉ ra chiêu.`
    : `Trust rules (most important):
- Only assert specific facts (prices, hours, addresses) when you have a fixer-verified fact in the FACTS section below.
- When using a fact, cite it inline with [^factId] syntax immediately after the sentence. DO NOT invent factIds. Use only factIds present in the FACTS list — the server will strip any citation referencing an unknown factId.
- **Critical**: the sentence immediately before [^factId] MUST be a direct paraphrase of that fact's content. Never staple a factId onto a generic claim to dress it as "verified".
- If no verified fact answers the question, say so directly: "I don't have a fixer-verified answer for that." Do not guess.
- Never recommend an unverified venue or service.
- When warning about scams, quote the scammer's exact verbal trigger first, then name the move.`;

const factsSection = (chunks: RetrievedChunk[], locale: Locale): string => {
  if (chunks.length === 0) {
    return locale === 'vi'
      ? 'FACTS: (trống) — Không có dữ kiện xác minh nào liên quan. Trả lời theo "we don\'t know" copy.'
      : 'FACTS: (empty) — No verified facts available. Reply with the "we don\'t know" pattern.';
  }
  const lines = chunks
    .map((c, idx) => `[^${c.sourceId ?? c.chunkId}] (${(c.similarity * 100).toFixed(0)}%): ${c.body}`)
    .join('\n');
  return locale === 'vi'
    ? `FACTS (dùng khi liên quan, trích đúng cú pháp [^factId]):
${lines}`
    : `FACTS (use when relevant, cite with [^factId]):
${lines}`;
};

const bilingualRulesSection = (locale: Locale): string =>
  locale === 'vi'
    ? `Quy tắc ngôn ngữ:
- Trả lời bằng tiếng Việt.
- Giữ nguyên tên gọi văn hoá (bún bò, áo dài, lễ hội) không dịch sang tiếng Anh.
- Tên hành chính chính thức dùng "TP.HCM" chỉ khi trích văn bản hành chính. Trong hội thoại tự xưng dùng "Sài Gòn".`
    : `Language rules:
- Reply in English.
- Keep Vietnamese cultural terms (bún bò, áo dài, lễ hội) untranslated when natural.
- Use "Saigon" in conversational voice (never "Ho Chi Minh City" / "TP.HCM" unless quoting an admin document).`;
