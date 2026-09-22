import { checkConnection } from '@/lib/db';

/**
 * Two small pieces of database honesty:
 *
 *  - `DbNotice` renders a slim amber bar whenever the app is serving the
 *    in-memory demo store instead of Postgres, so nobody mistakes a "successful"
 *    publish for something that will still be there tomorrow. The `error` text
 *    is deliberately omitted from the page and logged to the server console
 *    instead — connection strings and driver messages can be sensitive.
 *  - `DbDevStatus` prints a one-line status at the bottom of the feed while
 *    running `next dev`, which makes local setup obvious at a glance.
 */
export function DbNotice({ source, configured = true, error = null }) {
  if (source !== 'demo') return null;

  if (error) {
    console.error('[marginalia] falling back to the demo store:', error);
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50/80 print:hidden">
      <div className="mx-auto flex max-w-3xl flex-wrap items-baseline gap-x-2 gap-y-1 px-5 py-2.5 text-sm text-amber-900 sm:px-8">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-amber-800">
          Demo mode
        </span>
        <p>
          {configured
            ? 'The database could not be reached, so pieces are being kept in memory for this session only.'
            : 'No DATABASE_URL is configured, so pieces are being kept in memory for this session only.'}{' '}
          <span className="text-amber-800">
            Set <code className="font-mono text-xs">DATABASE_URL</code> and run{' '}
            <code className="font-mono text-xs">npm run db:init</code> to publish for real.
          </span>
        </p>
      </div>
    </div>
  );
}

export async function DbDevStatus() {
  if (process.env.NODE_ENV === 'production' && process.env.SHOW_DB_STATUS !== '1') return null;

  const { configured, ok, server } = await checkConnection();
  const label = !configured
    ? 'not configured'
    : ok
      ? `connected${server ? ` · ${server}` : ''}`
      : 'unreachable';
  const tone = ok ? 'text-emerald-700' : 'text-amber-700';

  return (
    <p className="mt-16 text-center font-mono text-[0.7rem] uppercase tracking-[0.2em] text-ink-400">
      <span aria-hidden="true">—</span> postgres: <span className={tone}>{label}</span>{' '}
      <span aria-hidden="true">—</span>
    </p>
  );
}
