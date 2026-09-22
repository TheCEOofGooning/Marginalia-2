/**
 * A single piece.
 *
 *   GET /api/posts/:id  → 200 { post, source } | 404 { error }
 *   DELETE /api/posts/:id → 204, but only when ALLOW_DELETES=1
 *
 * There is no authentication in this build, so DELETE is off unless you
 * explicitly switch it on (handy for clearing test rows; never leave it on in
 * front of an audience).
 */

import { NextResponse } from 'next/server';

import { deletePost, getPostById, toJSONPost } from '@/lib/posts';
import { parsePostId } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(_request, { params }) {
  const { id } = await params;
  const postId = parsePostId(id);

  if (!postId) {
    return NextResponse.json(
      { error: 'Invalid post id — expected a positive integer.' },
      { status: 400, headers: NO_STORE },
    );
  }

  const { post, source } = await getPostById(postId);

  if (!post) {
    return NextResponse.json({ error: 'No piece with that id.' }, { status: 404, headers: NO_STORE });
  }

  return NextResponse.json({ post: toJSONPost(post), source }, { headers: NO_STORE });
}

export async function DELETE(_request, { params }) {
  if (process.env.ALLOW_DELETES !== '1') {
    return NextResponse.json(
      {
        error:
          'Deleting is disabled. Set ALLOW_DELETES=1 to enable it (there is no authentication in this build).',
      },
      { status: 405, headers: NO_STORE },
    );
  }

  const { id } = await params;
  const postId = parsePostId(id);
  if (!postId) {
    return NextResponse.json(
      { error: 'Invalid post id — expected a positive integer.' },
      { status: 400, headers: NO_STORE },
    );
  }

  const { deleted, source } = await deletePost(postId);

  if (!deleted) {
    return NextResponse.json({ error: 'No piece with that id.' }, { status: 404, headers: NO_STORE });
  }

  return NextResponse.json({ deleted: true, id: postId, source }, { status: 200, headers: NO_STORE });
}
