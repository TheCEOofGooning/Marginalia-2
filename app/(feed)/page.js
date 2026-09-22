import Link from 'next/link';

import { DbDevStatus, DbNotice } from '@/components/DbStatus';
import EmptyFeed from '@/components/EmptyFeed';
import PostCard from '@/components/PostCard';
import { FEED_LIMIT, SITE } from '@/lib/constants';
import { getPosts, isDatabaseConfigured } from '@/lib/posts';
import { parsePostId } from '@/lib/validation';

/**
 * Rendered per request, never cached: the feed must show what was published a
 * second ago. (On Vercel this means one Neon round trip per page view — cheap at
 * this scale, and Neon's pooled endpoint is built for it.)
 */
export const dynamic = 'force-dynamic';

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FeedPage({ searchParams }) {
  const params = (await searchParams) ?? {};
  const requestedId = parsePostId(firstValue(params.published) ?? null);

  const { posts, source, error } = await getPosts({ limit: FEED_LIMIT });

  // The `?published=<id>` redirect from the publish action: confirm the write and
  // (via the `#post-<id>` anchor) let CSS highlight the new piece.
  const justPublished = requestedId ? posts.find((post) => post.id === requestedId) : null;

  return (
    <>
      <DbNotice source={source} configured={isDatabaseConfigured()} error={error} />

      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <header className="pb-12 pt-14 text-center sm:pt-20">
          <p className="text-[0.7rem] uppercase tracking-[0.3em] text-ink-400">
            {new Date().getUTCFullYear()}
            <span aria-hidden="true" className="px-2 text-ink-300">
              ·
            </span>
            {posts.length} {posts.length === 1 ? 'piece' : 'pieces'}
            <span aria-hidden="true" className="px-2 text-ink-300">
              ·
            </span>
            no signup
          </p>

          <h1 className="mt-5 font-display text-5xl leading-none tracking-tight text-ink-900 sm:text-6xl">
            {SITE.name}
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-balance text-[1.05rem] leading-relaxed text-ink-500">
            {SITE.description}
          </p>

          <p className="ornament mt-9" aria-hidden="true">
            ❦
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Link href="/publish" className="btn-primary">
              Publish a Story
            </Link>
            <span className="text-sm text-ink-400">
              Takes about a minute. Nothing to sign up for.
            </span>
          </div>
        </header>

        {justPublished ? (
          <p
            role="status"
            className="mb-10 rounded-sm border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900"
          >
            Published.{' '}
            <span className="font-display italic">“{justPublished.title}”</span> is at the top of the
            feed —{' '}
            <Link href={`/posts/${justPublished.id}`} className="underline underline-offset-2">
              open its page
            </Link>
            .
          </p>
        ) : null}

        <section aria-labelledby="feed-heading">
          <div className="mb-10 flex items-baseline gap-4 border-b border-ink-800/80 pb-2.5">
            <h2
              id="feed-heading"
              className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-ink-500"
            >
              Latest pieces
            </h2>
            <span className="ml-auto text-[0.7rem] uppercase tracking-[0.18em] text-ink-400">
              newest first
            </span>
          </div>

          {posts.length === 0 ? (
            <EmptyFeed />
          ) : (
            <div className="space-y-14">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} isTarget={post.id === requestedId} />
              ))}
            </div>
          )}
        </section>

        <DbDevStatus />
      </div>
    </>
  );
}
