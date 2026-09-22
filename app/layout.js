import localFont from 'next/font/local';

import Masthead from '@/components/Masthead';
import SiteFooter from '@/components/SiteFooter';
import { SITE } from '@/lib/constants';

import './globals.css';

/**
 * Typography.
 *
 * The two typefaces are shipped with the repo (app/fonts, OFL licensed) and
 * loaded through next/font/local. That means no network request to any font
 * CDN — not at build time for Vercel, not at runtime for the reader — and no
 * third-party request from a page that is meant to be about nothing but text.
 *
 * A display serif for titles and an inconspicuous grotesk for interface copy:
 * the classic literary-magazine pairing.
 *
 * Swapping in Google Fonts instead is a one-line change per family:
 *   import { Inter, Newsreader } from 'next/font/google';
 *   const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
 */
const inter = localFont({
  src: [
    { path: './fonts/inter-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/inter-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/inter-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

const newsreader = localFont({
  src: [
    { path: './fonts/newsreader-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/newsreader-latin-400-italic.woff2', weight: '400', style: 'italic' },
  ],
  display: 'swap',
  variable: '--font-newsreader',
  fallback: ['Iowan Old Style', 'Palatino Linotype', 'Palatino', 'Georgia', 'serif'],
});

export const metadata = {
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ['publishing', 'writing', 'essays', 'anonymous', 'literary magazine', 'Marginalia'],
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    siteName: SITE.name,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: '#f6f3ec',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
        >
          Skip to content
        </a>

        <Masthead />

        <main id="main" className="flex-1">
          {children}
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}
