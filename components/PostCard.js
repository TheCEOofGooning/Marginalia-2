import Link from 'next/link';

import ArticleText from '@/components/ArticleText';
import {
  excerpt,
  formatDate,
  formatDateTime,
  formatRelative,
  readingTime,
  toIsoString,
  wordCount,
} from '@/lib/format';
import { INLINE_FULL_TEXT_LIMIT } from '@/lib/constants';

/**
 * One piece in the feed.
 *
 * Short pieces are printed whole; longer ones are trimmed to an excerpt so the
 * feed stays scannable and every story still has a page of its own at
 * `/posts/[id]`. The `isTarget` flag (used by the `?published=` redirect) is
 * only there to add a small "New" marker — the highlight itself is pure CSS via
 * `:target`, so it works with JavaScript disabled.
 */
export default function PostCard({ post, isTarget = false }) {
  const isShort = post.content.length <= INLINE_FULL_TEXT_LIMIT;
  const createdAt = formatDateTime(post.created_at);
  const words = wordCount(post.content);

  return (
    <article
      id={`post-${post.id}`}
      className="post-card border-t border-ink-200/70 pt-9 first:border-t-0 first:pt-0"
    >
      <header className="mb-3.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span className="byline">{post.author}</span>
        <span aria-hidden="true" className="text-ink-300">
          ·
        </span>
        <time dateTime={toIsoString(post.created_at)} title={createdAt} className="text-ink-500">
          {formatDate(post.created_at)}
        </time>
        <span className="text-ink-400">({formatRelative(post.created_at)})</span>

        {isTarget ? (
          <span className="rounded-full bg-rust-100 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-rust-700">
            New
          </span>
        ) : null}

        <span className="ml-auto hidden text-[0.7rem] uppercase tracking-[0.18em] text-ink-400 sm:inline">
          {readingTime(post.content)}
        </span>
      </header>

      <h2 className="mb-3 font-display text-[1.75rem] leading-snug tracking-tight text-ink-900 sm:text-[2rem]">
        <Link
          href={`/posts/${post.id}`}
          className="rounded-sm transition-colors hover:text-rust-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rust-500"
        >
          {post.title}
        </Link>
      </h2>

      {isShort ? (
        <ArticleText content={post.content} dropCap className="text-ink-700" />
      ) : (
        <p className="post-body text-ink-600">{excerpt(post.content, 300)}</p>
      )}

      <footer className="mt-4 flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.18em] text-ink-400">
        <Link href={`/posts/${post.id}`} className="link-quiet">
          {isShort ? 'Permalink' : 'Read on'}
        </Link>
        <span className="sm:hidden">{readingTime(post.content)}</span>
        {!isShort ? <span className="ml-auto hidden sm:inline">{words} words</span> : null}
      </footer>
    </article>
  );
}
