#!/usr/bin/env node
/**
 * npm run db:reset -- --force
 *
 * Drops the `posts` table and recreates it empty. Destructive, so it does
 * nothing without an explicit `--force`.
 */

import { loadEnv, style } from './_env.mjs';

loadEnv();

const { execute, checkConnection, isDatabaseConfigured, ensureSchema, closePool } = await import(
  '../lib/db.js'
);

if (!isDatabaseConfigured()) {
  console.error(style.red('\nNo DATABASE_URL found — nothing to reset.\n'));
  process.exit(1);
}

if (!process.argv.includes('--force')) {
  const { rows } = await execute('SELECT COUNT(*)::int AS count FROM posts');
  const count = rows?.[0]?.count;

  console.log(style.yellow('\nThis drops the posts table and every piece in it.'));
  console.log(
    style.dim(
      typeof count === 'number' ? `  Currently ${count} ${count === 1 ? 'piece' : 'pieces'} stored.\n` : '\n',
    ),
  );
  console.log('  Re-run with --force to confirm:  npm run db:reset -- --force\n');
  await closePool();
  process.exit(0);
}

await execute('DROP TABLE IF EXISTS posts');
const result = await ensureSchema();

if (!result.ok) {
  console.error(style.red(`\nReset failed: ${result.error}\n`));
  await closePool();
  process.exit(1);
}

const { ok, server } = await checkConnection();
console.log(`${style.green('✓')} posts table dropped and recreated, empty`);
if (ok && server) console.log(style.dim(`  ${server}`));
console.log(style.dim('\nSeed it again with `npm run db:seed`.\n'));

await closePool();
process.exit(0);
