/**
 * Tiny .env loader for the CLI scripts.
 *
 * `next dev` reads .env.local for you, but `node scripts/db-init.mjs` does not,
 * and `node --env-file=.env.local` fails when the file is absent. This loads
 * .env.local then .env, never overwriting anything already in the environment,
 * so `DATABASE_URL=… npm run db:init` still wins.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function parse(contents) {
  const entries = [];

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const withoutExport = line.startsWith('export ') ? line.slice(7).trim() : line;
    const separator = withoutExport.indexOf('=');
    if (separator === -1) continue;

    const key = withoutExport.slice(0, separator).trim();
    if (!key) continue;

    let value = withoutExport.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      // strip trailing comments on unquoted values
      const hash = value.indexOf(' #');
      if (hash !== -1) value = value.slice(0, hash).trim();
    }

    entries.push([key, value]);
  }

  return entries;
}

export function loadEnv(root = process.cwd()) {
  const loaded = [];

  for (const file of ['.env.local', '.env']) {
    const path = join(root, file);
    if (!existsSync(path)) continue;

    for (const [key, value] of parse(readFileSync(path, 'utf8'))) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
        loaded.push(key);
      }
    }
  }

  return loaded;
}

/** Shared console styling so the four scripts look like one tool. */
export const style = {
  dim: (text) => `\x1b[2m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
};
