/**
 * JSON API for pieces.
 *
 *   GET  /api/posts?limit=20   → { posts: [...], count, source }
 *   POST /api/posts            → 201 { post, source } | 422 { errors }
 *
 * The browser UI uses server actions instead, but this endpoint keeps the app
 * scriptable (curl, tests, a future native client) and is the quickest way to
 * prove a Neon connection works after deploying.
 */

import { NextResponse } from 'next/server';

import { FEED_LIMIT } from '@/lib/constants';
import { createPost, getPosts, isDatabaseConfigured, toJSONPost } from '@/lib/posts';
import { validatePostInput } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

/** `source: 'demo'` means "no database, these live in memory until restart". */
function warningFor(source) {
  return source === 'demo'
    ? 'No database was reached: this piece was stored in the in-memory demo store and will not survive a restart. Set DATABASE_URL and run npm run db:init.'
    : undefined;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawLimit = searchParams.get('limit');

  let limit = FEED_LIMIT;
  if (rawLimit !== null) {
    const parsed = Number.parseInt(rawLimit, 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 200) {
      return NextResponse.json(
        { error: 'Invalid `limit` — expected an integer between 1 and 200.' },
        { status: 400, headers: NO_STORE },
      );
    }
    limit = parsed;
  }

  const { posts, source, error } = await getPosts({ limit });

  return NextResponse.json(
    {
      posts: posts.map(toJSONPost),
      count: posts.length,
      source,
      databaseConfigured: isDatabaseConfigured(),
      warning: error ? warningFor('demo') : undefined,
    },
    { headers: NO_STORE },
  );
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.' },
      { status: 400, headers: NO_STORE },
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json(
      { error: 'Expected a JSON object with `title`, `author` and `content`.' },
      { status: 400, headers: NO_STORE },
    );
  }

  const { ok, errors, value } = validatePostInput(body);

  if (!ok) {
    return NextResponse.json(
      { error: 'Validation failed.', errors },
      { status: 422, headers: NO_STORE },
    );
  }

  const { post, source, error } = await createPost(value);

  return NextResponse.json(
    { post: toJSONPost(post), source, warning: error ? warningFor('demo') : undefined },
    {
      status: 201,
      headers: { ...NO_STORE, Location: `/api/posts/${post.id}` },
    },
  );
}
