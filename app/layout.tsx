import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { resolveLocale, DEFAULT_LOCALE } from '@/lib/i18n/locale';
import { BilingualToggle } from '@/components/BilingualToggle';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://vietnam.app'),
  title: {
    default: 'vietnam — 10 province AIs, fixer-verified',
    template: '%s · vietnam',
  },
  description:
    'Chat with 10 AI agents, one per Tier-1 Vietnamese province. Local-verified, scam-aware. EN/VI.',
};

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params?: Promise<{ lang?: string }>;
}) {
  // App-Router root layout cannot read searchParams; the per-page server components
  // read ?lang= and pass to client components. We seed <html lang> from cookie-fallback
  // in middleware (not in this scaffold).
  const lang = DEFAULT_LOCALE;
  return (
    <html lang={lang}>
      <body className="min-h-screen bg-surface-base text-ink-primary">
        <header className="sticky top-0 z-20 border-b border-ink-secondary/10 bg-surface-base/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <a href="/" className="font-serif text-h3 tracking-tight">
              vietnam
            </a>
            <BilingualToggle />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-12 text-caption text-ink-secondary">
          Fixer-verified. No AI-generated imagery. EN/VI.
        </footer>
      </body>
    </html>
  );
}
