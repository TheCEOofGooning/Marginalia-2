import Link from 'next/link';
import { notFound } from 'next/navigation';

import ArticleText from '@/components/ArticleText';
import {
  formatDate,
  formatDateTime,
  readingTime,
  toIsoString,
  wordCount,
} from '@/lib/format';
import { getPostById } from '@/lib/posts';
import { parsePostId } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const postId = parsePostId(id);
  if (!postId) return { title: 'Piece not found' };

  const { post } = await getPostById(postId);
  if (!post) return { title: 'Piece not found' };

  return {
    title: post.title,
    description: post.content.replace(/\s+/g, ' ').slice(0, 180),
    openGraph: {
      title: post.title,
      description: post.content.replace(/\s+/g, ' ').slice(0, 180),
      type: 'article',
      publishedTime: toIsoString(post.created_at),
      authors: [post.author],
    },
  };
}

/** The reading view: one piece, all the air it needs. */
export default async function PostPage({ params }) {
  const { id } = await params;
  const postId = parsePostId(id);
  if (!postId) notFound();

  const { post } = await getPostById(postId);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <nav className="mb-10 flex items-center justify-between text-[0.7rem] uppercase tracking-[0.2em] text-ink-400">
        <Link href="/" className="link-quiet">
          ← Back to the feed
        </Link>
        <span aria-hidden="true">#{post.id}</span>
      </nav>

      <header className="border-b border-ink-200 pb-8">
        <h1 className="break-anywhere font-display text-[2.5rem] leading-[1.1] tracking-tight text-ink-900 sm:text-[3.25rem]">
          {post.title}
        </h1>

        <p className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-ink-500">
          <span className="byline text-[1.15rem]">{post.author}</span>
          <span aria-hidden="true" className="text-ink-300">
            ·
          </span>
          <time dateTime={toIsoString(post.created_at)} title={formatDateTime(post.created_at)}>
            {formatDate(post.created_at)}
          </time>
          <span aria-hidden="true" className="text-ink-300">
            ·
          </span>
          <span>{readingTime(post.content)}</span>
          <span aria-hidden="true" className="text-ink-300">
            ·
          </span>
          <span>{wordCount(post.content).toLocaleString('en-US')} words</span>
        </p>
      </header>

      <ArticleText content={post.content} dropCap className="mt-10 text-ink-700" />

      <footer className="mt-16 border-t border-ink-200 pt-8">
        <p className="ornament" aria-hidden="true">
          ❦
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-ink-500">
          <p>
            Published on Marginalia by <span className="byline">{post.author}</span>.
          </p>
          <Link href="/publish" className="btn-primary btn-sm">
            Publish your own
          </Link>
        </div>
      </footer>
    </article>
  );
}
