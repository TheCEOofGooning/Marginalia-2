#!/usr/bin/env node
/**
 * npm run verify [-- --url https://your-app.vercel.app]
 *
 * Preflight check for a deployment. Confirms, in order:
 *   1. DATABASE_URL is present (and hides everything but its host)
 *   2. Postgres answers, and how fast
 *   3. the `posts` table exists and how many pieces it holds
 *   4. if --url is given, GET /api/health and GET /api/posts on the live site
 *
 * Exit code is 0 only when everything checked out, so it can gate a CI step.
 */

import { loadEnv, style } from './_env.mjs';

loadEnv();

const { execute, checkConnection, isDatabaseConfigured, getDatabaseUrl, closePool } = await import(
  '../lib/db.js'
);

let failures = 0;

function pass(label, detail) {
  console.log(`${style.green('✓')} ${label}${detail ? style.dim(`  ${detail}`) : ''}`);
}

function fail(label, detail) {
  failures += 1;
  console.log(`${style.red('✗')} ${label}${detail ? `  ${detail}` : ''}`);
}

function hostOf(connectionString) {
  try {
    const url = new URL(connectionString);
    return `${url.hostname}${url.port ? `:${url.port}` : ''}`;
  } catch {
    return 'unparseable connection string';
  }
}

console.log(style.bold('\nMarginalia — preflight\n'));

// 1 ─ environment ------------------------------------------------------------
const connectionString = getDatabaseUrl();

if (!isDatabaseConfigured()) {
  fail('DATABASE_URL', 'not set — the app will run on its in-memory demo store');
  console.log(style.dim('\n  cp .env.example .env.local  →  paste your Neon pooled string\n'));
} else {
  const looksNeon = /neon\.tech/.test(connectionString);
  const pooled = /-pooler\./.test(connectionString);
  pass('DATABASE_URL', `host ${hostOf(connectionString)}`);
  console.log(
    style.dim(
      `  provider: ${looksNeon ? 'Neon' : 'other Postgres'}${looksNeon && !pooled ? ' — tip: use the pooled endpoint on Vercel' : ''}`,
    ),
  );

  // TLS is decided by the connection string before this code gets a say, so
  // report what will actually happen rather than what was intended.
  // (Verified against pg 8: sslmode=require means "verify the certificate",
  // identical to verify-full; channel_binding is parsed but ignored.)
  const sslmode = new URL(connectionString).searchParams.get('sslmode');
  const tlsNote = !sslmode
    ? 'not set in the URL — Marginalia enables TLS for non-localhost hosts'
    : sslmode === 'disable'
      ? 'disabled'
      : `${sslmode} → certificate verified`;
  console.log(style.dim(`  tls: ${tlsNote}`));

  if (sslmode === 'require') {
    console.log(
      style.dim('  tip: sslmode=verify-full behaves identically in pg 8 and silences its SSL-mode notice'),
    );
  }
}

// 2 ─ connection -------------------------------------------------------------
if (isDatabaseConfigured()) {
  const started = Date.now();
  const { ok, error, server } = await checkConnection();

  if (ok) {
    pass('connection', `${Date.now() - started} ms${server ? ` · ${server}` : ''}`);
  } else {
    fail('connection', error ?? 'unknown error');
    console.log(
      style.dim('  Check the password, the ?sslmode=require suffix and whether your IP is allowed.'),
    );
  }

  // 3 ─ table -----------------------------------------------------------------
  if (ok) {
    const { ok: tableOk, rows, error: tableError } = await execute(
      'SELECT COUNT(*)::int AS count FROM posts',
    );

    if (tableOk) {
      pass('posts table', `${rows[0].count} stored`);
    } else if (/does not exist/i.test(tableError ?? '')) {
      fail('posts table', 'missing — run `npm run db:init`');
    } else {
      fail('posts table', tableError ?? 'unknown error');
    }
  }
}

// 4 ─ deployed site (optional) ----------------------------------------------
const urlFlag = process.argv.indexOf('--url');
const target = urlFlag !== -1 ? process.argv[urlFlag + 1] : null;

if (target) {
  const base = target.replace(/\/+$/, '');

  try {
    const health = await fetch(`${base}/api/health`, { cache: 'no-store' });
    const body = await health.json();

    if (health.ok && body.database?.connected) {
      pass(`${base}/api/health`, `database connected${body.database.server ? ` · ${body.database.server}` : ''}`);
    } else {
      fail(`${base}/api/health`, JSON.stringify(body.database ?? body));
    }
  } catch (error) {
    fail(`${base}/api/health`, error.message);
  }

  try {
    const posts = await fetch(`${base}/api/posts?limit=5`, { cache: 'no-store' });
    const body = await posts.json();
    const first = body.posts?.[0]?.title;
    pass(
      `${base}/api/posts`,
      `${body.count ?? '?'} returned${first ? ` · newest: “${first}”` : ''} · source: ${body.source ?? '?'}`,
    );
  } catch (error) {
    fail(`${base}/api/posts`, error.message);
  }
}

console.log(
  failures === 0
    ? style.green('\nEverything checks out.\n')
    : style.red(`\n${failures} check${failures === 1 ? '' : 's'} failed.\n`),
);

await closePool();
process.exit(failures === 0 ? 0 : 1);
