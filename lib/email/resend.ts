import { Resend } from 'resend';

let _resend: Resend | null = null;

export const resend = (): Resend => {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY not set');
    _resend = new Resend(apiKey);
  }
  return _resend;
};

export const fromAddress = (): string =>
  process.env.RESEND_FROM_EMAIL || 'hello@vietnam.app';

export interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** RFC 5322 tags for Resend dashboard filtering */
  tags?: { name: string; value: string }[];
}

export const sendEmail = async (args: SendArgs): Promise<string> => {
  const { data, error } = await resend().emails.send({
    from: fromAddress(),
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    tags: args.tags,
  });
  if (error) throw new Error(`Resend send failed: ${error.message}`);
  return data?.id ?? '';
};
