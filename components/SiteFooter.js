import Link from 'next/link';

import { SITE } from '@/lib/constants';

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink-200/80 bg-paper-raised/60">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-5 py-10 text-sm text-ink-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="font-display text-base text-ink-600">
          {SITE.name} — {SITE.tagline.toLowerCase()}
        </p>
        <p className="text-[0.7rem] uppercase tracking-[0.24em]">
          <Link href="/publish" className="transition-colors hover:text-ink-700">
            Write something
          </Link>
          <span aria-hidden="true" className="px-2 text-ink-300">
            ·
          </span>
          No signup, ever
        </p>
      </div>
    </footer>
  );
}
