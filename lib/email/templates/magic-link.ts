import type { Locale } from '@/types/domain';

interface Args {
  locale: Locale;
  consumeUrl: string;
  expiresInMinutes: number;
}

/**
 * Magic-link email body in EN or VI.
 * See 02-SPECS/anonymous-rate-limit-and-email-gate.md + 04-DESIGN/narrative-voice-deck.md §1 brand voice.
 * Voice: trustworthy local friend, not tour-guide; honest; never sells.
 */
export const magicLinkEmail = ({ locale, consumeUrl, expiresInMinutes }: Args) => {
  if (locale === 'vi') {
    const text =
      `Bạn vừa yêu cầu mở thêm tin nhắn trên vietnam.app.\n\n` +
      `Mở link sau trong ${expiresInMinutes} phút (chỉ dùng được 1 lần):\n${consumeUrl}\n\n` +
      `Nếu không phải bạn, bỏ qua email này — không có gì xảy ra.\n\n` +
      `— vietnam.app\nMã nguồn mở · MIT · github.com/DungMai/vietnam`;
    const html =
      `<!doctype html><html lang="vi"><body style="font-family:Inter,-apple-system,sans-serif;color:#1A1A1A;background:#FBF8F2;padding:32px 16px;">` +
      `<div style="max-width:520px;margin:0 auto;">` +
      `<div style="font-family:'Source Serif Pro',Georgia,serif;font-size:24px;margin-bottom:24px;">vietnam.app</div>` +
      `<p style="font-size:16px;line-height:1.6;">Bạn vừa yêu cầu mở thêm tin nhắn.</p>` +
      `<p style="margin:24px 0;"><a href="${escapeHtml(consumeUrl)}" style="background:#1A1A1A;color:#FBF8F2;padding:12px 20px;text-decoration:none;border-radius:8px;display:inline-block;">Mở thêm tin nhắn</a></p>` +
      `<p style="font-size:14px;color:#4A4A4A;">Link có hiệu lực ${expiresInMinutes} phút và chỉ dùng được 1 lần.</p>` +
      `<p style="font-size:14px;color:#4A4A4A;">Nếu không phải bạn, bỏ qua email này — không có gì xảy ra.</p>` +
      `<hr style="border:none;border-top:1px solid rgba(0,0,0,0.1);margin:24px 0;">` +
      `<p style="font-size:13px;color:#4A4A4A;">vietnam.app · Mã nguồn mở · MIT · <a href="https://github.com/DungMai/vietnam" style="color:#4A4A4A;">github.com/DungMai/vietnam</a></p>` +
      `</div></body></html>`;
    return {
      subject: 'vietnam.app — mở thêm tin nhắn',
      text,
      html,
    };
  }

  const text =
    `You requested more messages on vietnam.app.\n\n` +
    `Open the link below within ${expiresInMinutes} minutes (single-use):\n${consumeUrl}\n\n` +
    `If this wasn't you, ignore this email — nothing happens.\n\n` +
    `— vietnam.app\nOpen source · MIT · github.com/DungMai/vietnam`;
  const html =
    `<!doctype html><html lang="en"><body style="font-family:Inter,-apple-system,sans-serif;color:#1A1A1A;background:#FBF8F2;padding:32px 16px;">` +
    `<div style="max-width:520px;margin:0 auto;">` +
    `<div style="font-family:'Source Serif Pro',Georgia,serif;font-size:24px;margin-bottom:24px;">vietnam.app</div>` +
    `<p style="font-size:16px;line-height:1.6;">You requested more messages.</p>` +
    `<p style="margin:24px 0;"><a href="${escapeHtml(consumeUrl)}" style="background:#1A1A1A;color:#FBF8F2;padding:12px 20px;text-decoration:none;border-radius:8px;display:inline-block;">Unlock more messages</a></p>` +
    `<p style="font-size:14px;color:#4A4A4A;">Link is valid for ${expiresInMinutes} minutes and works once.</p>` +
    `<p style="font-size:14px;color:#4A4A4A;">If this wasn't you, ignore this email — nothing happens.</p>` +
    `<hr style="border:none;border-top:1px solid rgba(0,0,0,0.1);margin:24px 0;">` +
    `<p style="font-size:13px;color:#4A4A4A;">vietnam.app · Open source · MIT · <a href="https://github.com/DungMai/vietnam" style="color:#4A4A4A;">github.com/DungMai/vietnam</a></p>` +
    `</div></body></html>`;
  return {
    subject: 'vietnam.app — unlock more messages',
    text,
    html,
  };
};

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
