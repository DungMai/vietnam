import type { Locale } from '@/types/domain';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'vi'];
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Resolve locale from a request URL param (?lang=) — single canonical pattern.
 * See 02-SPECS/bilingual-content-and-rendering.md §SEO.
 */
export const resolveLocale = (raw: string | null | undefined): Locale => {
  if (raw === 'vi' || raw === 'en') return raw;
  return DEFAULT_LOCALE;
};

/**
 * Pick the right field from a bilingual record `{ en, vi }` by locale.
 */
export const pickLocale = <T>(record: { en: T; vi: T }, locale: Locale): T =>
  record[locale];

/**
 * Honest "we don't know" copy — see narrative-voice-deck.md §3.
 */
export const dontKnowCopy: Record<Locale, string[]> = {
  en: [
    "We don't have a fixer-verified answer for that yet. Here's what we know without verification —",
    "Honestly: nobody on our team has verified this recently. Treat as unverified.",
    "Below the threshold. We'd rather say so than guess.",
  ],
  vi: [
    "Chúng tôi chưa có câu trả lời được fixer xác minh cho điều đó. Đây là điều chưa kiểm chứng —",
    "Thành thật: chưa ai trong nhóm xác minh điều này gần đây. Hãy xem như chưa kiểm chứng.",
    "Dưới ngưỡng tin cậy. Chúng tôi thà nói thẳng còn hơn đoán.",
  ],
};
