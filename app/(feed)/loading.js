/**
 * Route-level loading state: the same page geometry as the feed, so the layout
 * does not jump when the pieces arrive from Neon.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-5 py-14 sm:px-8 sm:py-20" aria-busy="true">
      <span className="sr-only">Fetching the latest pieces…</span>

      <div className="flex flex-col items-center gap-5">
        <div className="h-3 w-44 rounded-sm bg-ink-100" />
        <div className="h-12 w-64 rounded-sm bg-ink-100" />
        <div className="h-3 w-full max-w-md rounded-sm bg-ink-100" />
        <div className="h-3 w-4/5 max-w-sm rounded-sm bg-ink-100" />
      </div>

      <div className="mt-16 space-y-14">
        {[0, 1, 2].map((row) => (
          <div key={row} aria-hidden="true">
            <div className="h-3 w-40 rounded-sm bg-ink-100" />
            <div className="mt-4 h-7 w-3/4 rounded-sm bg-ink-100" />
            <div className="mt-5 space-y-2.5">
              <div className="h-3 w-full rounded-sm bg-ink-100" />
              <div className="h-3 w-11/12 rounded-sm bg-ink-100" />
              <div className="h-3 w-2/3 rounded-sm bg-ink-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
