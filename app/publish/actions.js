'use server';

/**
 * The write path for publishing a piece.
 *
 * A server action rather than a client-side fetch, which means the form works
 * with JavaScript disabled too: the browser posts the fields, Next.js runs this
 * function on the server, and the same validation + insert path as
 * `POST /api/posts` is used. Either way the piece lands in Neon and the writer
 * is redirected straight back to the feed.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createPost } from '@/lib/posts';
import { validatePostInput } from '@/lib/validation';

/** Keep what the writer typed so a rejected submission is never lost. */
function rawValue(formData, field) {
  const value = formData.get(field);
  return typeof value === 'string' ? value : '';
}

export async function publishPost(prevState, formData) {
  const raw = {
    title: rawValue(formData, 'title'),
    author: rawValue(formData, 'author'),
    content: rawValue(formData, 'content'),
  };

  const { ok, errors, value } = validatePostInput(raw);

  if (!ok) {
    return {
      ok: false,
      errors,
      values: raw,
      message: 'This piece is not quite ready to publish.',
    };
  }

  const { post, error } = await createPost(value);

  if (error) {
    // The piece was still stored — in the demo store — so the writer keeps
    // their work, and the feed will show the "demo mode" notice. The reason
    // stays in the server logs rather than in the URL.
    console.error('[marginalia] publish fell back to the demo store:', error);
  }

  // Server actions in Next 16 have their own caching; make sure the feed
  // reflects the new piece even if someone drops `force-dynamic` later.
  revalidatePath('/');
  revalidatePath(`/posts/${post.id}`);

  // `redirect` throws, so it must be the last statement and outside try/catch.
  // The `#post-<id>` anchor is what makes the new piece light up in the feed.
  redirect(`/?published=${post.id}#post-${post.id}`);
}
