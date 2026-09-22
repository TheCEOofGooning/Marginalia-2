'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Route-level error boundary. Most likely cause in this build: a database that
 * is configured but unreachable. (A missing DATABASE_URL is handled gracefully —
 * the app falls back to its demo store and no error is thrown at all.)
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('[marginalia] route error:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
      <p className="label">Something went wrong</p>
      <h1 className="mt-4 font-display text-4xl tracking-tight text-ink-900">
        This page could not be set
      </h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-500">
        The press jammed. If you have just connected Neon, check that{' '}
        <code className="font-mono text-sm">DATABASE_URL</code> is set and that the table exists, then
        try again.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="link-quiet text-sm">
          Back to the feed
        </Link>
      </div>

      {error?.digest ? (
        <p className="mt-10 font-mono text-xs text-ink-400">reference: {error.digest}</p>
      ) : null}
    </div>
  );
}
