import Link from 'next/link';

/** Shown when the database (and the demo store) contain nothing worth reading. */
export default function EmptyFeed() {
  return (
    <div className="border-y border-dashed border-ink-200 py-16 text-center">
      <p className="ornament" aria-hidden="true">
        ❧
      </p>
      <h2 className="mt-3 font-display text-2xl text-ink-800">Nothing here yet</h2>
      <p className="mx-auto mt-2 max-w-md text-ink-500">
        The margins are blank. Be the first to fill one — no account, no email, no waiting.
      </p>
      <Link href="/publish" className="btn-primary mt-7">
        Publish the first story
      </Link>
    </div>
  );
}
