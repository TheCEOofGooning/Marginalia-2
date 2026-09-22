/**
 * The one module the rest of the app uses to read and write pieces.
 *
 * Every function prefers Postgres (Neon). If `DATABASE_URL` is missing, or the
 * connection fails, it transparently falls back to the in-memory demo store so
 * the site keeps working. The returned `source` tells the UI which backend was
 * used, and `error` carries the reason when a database the app *thought* it had
 * turned out to be unreachable.
 */

import 'server-only';

import { DEFAULT_AUTHOR, FEED_LIMIT } from './constants.js';
import { toIsoString } from './format.js';
import {
  CREATE_INDEX_SQL,
  SCHEMA_SQL,
  execute,
  isDatabaseConfigured,
  demo as demoStore,
} from './db.js';

export { SCHEMA_SQL, CREATE_INDEX_SQL, isDatabaseConfigured };

/** Columns returned to the UI — never `SELECT *`. */
const COLUMNS = 'id, title, author, content, created_at';

/** ISO-8601 strings, so the JSON API always looks the same from any driver. */
export function toJSONPost(post) {
  return {
    id: post.id,
    title: post.title,
    author: post.author,
    content: post.content,
    created_at: toIsoString(post.created_at),
  };
}

/** Postgres gives us Date objects; the demo store already stores Dates. */
function normalizeRow(row) {
  return {
    id: Number(row.id),
    title: row.title ?? '',
    author: row.author?.trim() ? row.author.trim() : DEFAULT_AUTHOR,
    content: row.content ?? '',
    created_at: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
  };
}

/** True when a failed query was caused by a missing `posts` table. */
function isMissingTable(error) {
  return typeof error === 'string' && /relation .*posts.* does not exist/i.test(error);
}

/**
 * All pieces, newest first.
 *
 * @param {{ limit?: number }} [options]
 * @returns {Promise<{ posts: Array, source: 'database'|'demo', error: string|null }>}
 */
export async function getPosts({ limit = FEED_LIMIT } = {}) {
  if (isDatabaseConfigured()) {
    const result = await execute(
      `SELECT ${COLUMNS} FROM posts ORDER BY created_at DESC, id DESC LIMIT $1`,
      [limit],
    );

    if (result.ok) {
      return { posts: result.rows.map(normalizeRow), source: 'database', error: null };
    }

    // A database that exists but has no table yet: create it, then retry once.
    if (isMissingTable(result.error) && (await execute(SCHEMA_SQL)).ok) {
      const retry = await execute(
        `SELECT ${COLUMNS} FROM posts ORDER BY created_at DESC, id DESC LIMIT $1`,
        [limit],
      );
      if (retry.ok) {
        return { posts: retry.rows.map(normalizeRow), source: 'database', error: null };
      }
    }

    return { posts: demoStore.listPosts({ limit }), source: 'demo', error: result.error };
  }

  return { posts: demoStore.listPosts({ limit }), source: 'demo', error: null };
}

/**
 * A single piece, or `null` when it does not exist.
 *
 * @param {number} id
 * @returns {Promise<{ post: object|null, source: 'database'|'demo', error: string|null }>}
 */
export async function getPostById(id) {
  if (isDatabaseConfigured()) {
    const result = await execute(`SELECT ${COLUMNS} FROM posts WHERE id = $1`, [id]);
    if (result.ok) {
      const row = result.rows[0];
      return { post: row ? normalizeRow(row) : null, source: 'database', error: null };
    }
    return { post: demoStore.findPost(id), source: 'demo', error: result.error };
  }

  return { post: demoStore.findPost(id), source: 'demo', error: null };
}

/**
 * Insert a piece and return the stored row.
 *
 * @param {{ title: string, author?: string, content: string }} input already validated
 * @returns {Promise<{ post: object, source: 'database'|'demo', error: string|null }>}
 */
export async function createPost(input) {
  const author = input.author?.trim() || DEFAULT_AUTHOR;
  const values = [input.title, author, input.content];

  if (isDatabaseConfigured()) {
    let result = await execute(
      `INSERT INTO posts (title, author, content) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
      values,
    );

    if (!result.ok && isMissingTable(result.error)) {
      // First publish against a brand-new Neon database: create the table and
      // try once more. There is a race here if many requests arrive at the same
      // time on an empty database; `IF NOT EXISTS` makes it harmless.
      await execute(SCHEMA_SQL);
      await execute(CREATE_INDEX_SQL);
      result = await execute(
        `INSERT INTO posts (title, author, content) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
        values,
      );
    }

    if (result.ok && result.rows[0]) {
      return { post: normalizeRow(result.rows[0]), source: 'database', error: null };
    }

    return {
      post: demoStore.createPost({ ...input, author }),
      source: 'demo',
      error: result.error,
    };
  }

  return {
    post: demoStore.createPost({ ...input, author }),
    source: 'demo',
    error: null,
  };
}

/**
 * Remove a piece. Off by default at the API layer (`ALLOW_DELETES=1`), but kept
 * here so the seed/cleanup scripts and tests have one obvious way to do it.
 *
 * @param {number} id
 * @returns {Promise<{ deleted: boolean, source: 'database'|'demo', error: string|null }>}
 */
export async function deletePost(id) {
  if (isDatabaseConfigured()) {
    const result = await execute('DELETE FROM posts WHERE id = $1 RETURNING id', [id]);
    if (result.ok) {
      return { deleted: result.rows.length > 0, source: 'database', error: null };
    }
    return { deleted: false, source: 'demo', error: result.error };
  }

  return { deleted: demoStore.deletePost(id), source: 'demo', error: null };
}
