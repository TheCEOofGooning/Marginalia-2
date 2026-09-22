import Link from 'next/link';

import { SITE } from '@/lib/constants';

/** Sticky masthead: wordmark on the left, the one call to action on the right. */
export default function Masthead() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/80 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link
          href="/"
          className="flex items-baseline gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rust-500"
        >
          <span className="font-display text-2xl leading-none tracking-tight text-ink-900">
            {SITE.name}
          </span>
          <span className="hidden text-[0.65rem] uppercase tracking-[0.28em] text-ink-400 sm:inline">
            Letters &amp; margins
          </span>
        </Link>

        <nav className="flex items-center gap-5">
          <Link
            href="/"
            className="hidden text-sm text-ink-500 transition-colors hover:text-ink-900 sm:inline"
          >
            Read
          </Link>
          <Link href="/publish" className="btn-primary btn-sm">
            Publish a Story
          </Link>
        </nav>
      </div>
    </header>
  );
}
