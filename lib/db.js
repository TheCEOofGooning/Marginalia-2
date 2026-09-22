/**
 * Postgres access for Marginalia.
 *
 * Marginalia talks to Neon through the standard `pg` driver, which is what
 * makes the same code work against Neon, a local Postgres, or the test Postgres
 * used by `npm test`. Neon's pooled endpoint (`…-pooler.…neon.tech`) accepts
 * ordinary Postgres clients, so nothing Neon-specific is required here. If you
 * would rather use Neon's HTTP driver, see DEPLOY.md — it is a two-line swap in
 * this file.
 *
 * Notes on serverless:
 *  - The pool is cached on `globalThis` so a warm Vercel function reuses its
 *    connections instead of opening a fresh one for every request, and so a dev
 *    hot-reload does not leak pools.
 *  - `serverExternalPackages: ['pg']` in next.config.mjs keeps the driver out of
 *    the bundler, which is what lets it find its optional native bits at runtime.
 *  - `execute()` never throws: an unreachable or unconfigured database returns
 *    `{ ok: false }`, and `lib/posts.js` falls back to the demo store so the site
 *    keeps working.
 */

import 'server-only';

import pg from 'pg';

import { POSTS_TABLE } from './constants.js';
import * as demoStore from './demo-store.js';

/** Works with either CommonJS or ESM interop shape of the `pg` package. */
const Pool = pg?.Pool ?? pg?.default?.Pool;

/**
 * Schema for the one table the app needs. `IF NOT EXISTS` makes it safe to run
 * on every boot, and matches `db/schema.sql` exactly.
 */
export const SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS ${POSTS_TABLE} (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT DEFAULT 'Anonymous',
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

export const CREATE_INDEX_SQL = `CREATE INDEX IF NOT EXISTS ${POSTS_TABLE}_created_at_idx
  ON ${POSTS_TABLE} (created_at DESC);`;

/** Only ever exposed as a boolean — never log or return the URL itself. */
export function getDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  return url ? url : null;
}

export function isDatabaseConfigured() {
  return getDatabaseUrl() !== null;
}

function isLocalHost(host) {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '0.0.0.0' ||
    host.endsWith('.local')
  );
}

/**
 * Neon requires TLS; a local Postgres usually has no certificate at all.
 * Hosted providers generally present a certificate, so `rejectUnauthorized`
 * stays relaxed the way most managed-Postgres guides set it. Override with
 * DATABASE_SSL=require|disable when your setup differs.
 */
function sslFor(connectionString) {
  const override = process.env.DATABASE_SSL?.trim().toLowerCase();
  if (override === 'disable' || override === 'false') return false;
  if (override === 'require' || override === 'true') return { rejectUnauthorized: false };

  try {
    const { hostname } = new URL(connectionString);
    return isLocalHost(hostname) ? false : { rejectUnauthorized: false };
  } catch {
    return { rejectUnauthorized: false };
  }
}

/** Cached pool, reused across requests, function invocations and hot reloads. */
export function getPool() {
  const connectionString = getDatabaseUrl();
  if (!connectionString || !Pool) return null;

  const cached = globalThis.__marginaliaPool;
  if (cached && cached.connectionString === connectionString) return cached.pool;

  const pool = new Pool({
    connectionString,
    ssl: sslFor(connectionString),
    max: Number(process.env.PG_POOL_MAX || 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  // A client that dies while idle must not take the process down with an
  // unhandled 'error' event.
  pool.on('error', (error) => {
    console.error('[marginalia] idle postgres client error:', error.message);
  });

  globalThis.__marginaliaPool = { connectionString, pool };
  return pool;
}

/**
 * Run a query and report what happened, without ever throwing at the caller.
 *
 * @param {string} text  SQL with $1, $2 … placeholders
 * @param {unknown[]} [params]
 * @returns {Promise<{ ok: boolean, rows: unknown[]|null, error: string|null }>}
 */
export async function execute(text, params = []) {
  const pool = getPool();
  if (!pool) {
    return { ok: false, rows: null, error: 'DATABASE_URL is not configured' };
  }

  try {
    const result = await pool.query(text, params);
    return { ok: true, rows: result.rows, error: null };
  } catch (error) {
    console.error('[marginalia] postgres query failed:', error.message);
    return { ok: false, rows: null, error: error.message };
  }
}

/**
 * Create the `posts` table and its index if they are missing.
 * Used by `npm run db:init`, and by the first publish against a fresh database.
 */
export async function ensureSchema() {
  const table = await execute(SCHEMA_SQL);
  if (!table.ok) return table;
  return execute(CREATE_INDEX_SQL);
}

/**
 * Close the cached pool. The long-running Next.js server never calls this; the
 * CLI scripts do, so they exit instead of hanging on an open socket.
 */
export async function closePool() {
  const cached = globalThis.__marginaliaPool;
  if (!cached) return;
  delete globalThis.__marginaliaPool;
  try {
    await cached.pool.end();
  } catch {
    // nothing useful to do while shutting down
  }
}

/** Used by `/api/health`, `npm run verify` and the dev status line. */
export async function checkConnection() {
  if (!isDatabaseConfigured()) {
    return { configured: false, ok: false, error: null, server: null };
  }

  const { ok, rows, error } = await execute('SELECT version() AS version');
  return {
    configured: true,
    ok,
    error,
    server:
      ok && rows?.[0]?.version
        ? String(rows[0].version).split(' ').slice(0, 2).join(' ')
        : null,
  };
}

export const demo = demoStore;
