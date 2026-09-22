import Link from 'next/link';

export const metadata = {
  title: 'Not found',
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
      <p className="ornament" aria-hidden="true">
        ❧
      </p>
      <h1 className="mt-5 font-display text-4xl tracking-tight text-ink-900">
        This page was never printed
      </h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-500">
        The piece you are looking for has been misplaced, or it never existed at all. The feed is
        still where it always is.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <Link href="/" className="btn-primary">
          Back to the feed
        </Link>
        <Link href="/publish" className="link-quiet text-sm">
          Publish something instead
        </Link>
      </div>
    </div>
  );
}
