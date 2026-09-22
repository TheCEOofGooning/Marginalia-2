#!/usr/bin/env node
/**
 * npm run db:init — create the `posts` table (and its index) if missing.
 *
 * Safe to run repeatedly: the statements use IF NOT EXISTS. Uses the same SQL
 * that the app runs the first time it publishes against an empty database.
 *
 * The `--conditions=react-server` flag in the npm script is what lets this file
 * import `lib/db.js`, which is marked `server-only` so it can never be bundled
 * into the browser.
 */

import { loadEnv, style } from './_env.mjs';

loadEnv();

// Imported after loadEnv() so the connection string is already in place.
const { ensureSchema, checkConnection, isDatabaseConfigured, SCHEMA_SQL, closePool } = await import(
  '../lib/db.js'
);

if (!isDatabaseConfigured()) {
  console.error(style.red('\nNo DATABASE_URL found.\n'));
  console.error('  1. Copy the example env file:  cp .env.example .env.local');
  console.error('  2. Paste your Neon pooled connection string into DATABASE_URL');
  console.error('  3. Run this again:             npm run db:init\n');
  process.exit(1);
}

console.log(style.dim('\nRunning:\n'));
console.log(`${SCHEMA_SQL}\n`);

const result = await ensureSchema();

if (!result.ok) {
  console.error(style.red(`Could not create the table: ${result.error}\n`));
  await closePool();
  process.exit(1);
}

const { ok, server } = await checkConnection();

console.log(`${style.green('✓')} posts table ready`);
if (ok && server) console.log(style.dim(`  ${server}`));
console.log(style.dim('\nNext: npm run db:seed to add sample pieces, or npm run dev to start writing.\n'));

await closePool();
process.exit(0);
