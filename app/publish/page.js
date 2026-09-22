import Link from 'next/link';

import { DbNotice } from '@/components/DbStatus';
import PublishForm from '@/components/PublishForm';
import { DEFAULT_AUTHOR } from '@/lib/constants';
import { isDatabaseConfigured } from '@/lib/posts';

import { publishPost } from './actions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Publish a Story',
  description:
    'Publish text to Marginalia. No account, no email — just a title, an optional pen name and your words.',
};

export default function PublishPage() {
  const configured = isDatabaseConfigured();

  return (
    <>
      {/* Warn before writing, not after: without a database the piece will not survive a restart. */}
      <DbNotice source={configured ? 'database' : 'demo'} configured={configured} />

      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <header className="mb-12 border-b border-ink-200 pb-7">
          <p className="label">Submission</p>
          <h1 className="mt-3.5 font-display text-4xl leading-tight tracking-tight text-ink-900 sm:text-[2.75rem]">
            Publish a story
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-ink-500">
            Write it, sign it if you like, publish it. Your piece appears on the feed the moment you
            press the button — instantly, anonymously, and without an account.
          </p>
        </header>

        <PublishForm action={publishPost} />

        <aside className="mt-16 grid gap-8 border-t border-ink-200 pt-8 text-sm text-ink-500 sm:grid-cols-2">
          <div>
            <h2 className="label">A few notes</h2>
            <ul className="mt-3 space-y-2.5">
              <li>
                Leave the pen name blank and the piece is published as{' '}
                <span className="byline">{DEFAULT_AUTHOR}</span>.
              </li>
              <li>Plain text only. A blank line starts a new paragraph.</li>
              <li>
                Nothing is edited, ranked or moderated here — this is a test build, so publish with
                that in mind.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="label">Where it goes</h2>
            <p className="mt-3 leading-relaxed">
              Straight into the <code className="font-mono text-xs">posts</code> table of the
              configured Postgres database, newest first on the{' '}
              <Link href="/" className="link-quiet">
                feed
              </Link>
              . Every piece keeps its own permalink, so you can share a single page.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
