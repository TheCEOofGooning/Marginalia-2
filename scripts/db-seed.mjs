#!/usr/bin/env node
/**
 * npm run db:seed [-- --force]
 *
 * Inserts six sample pieces so a fresh database looks like a magazine rather
 * than an empty page. Refuses to run when the table already has rows unless
 * `--force` is passed, so seeding twice does not double everything.
 *
 * Writes go through the same `createPost()` the site uses, which means the same
 * validation, the same insert, the same fallback rules — and if the fallback is
 * used, this script fails loudly instead of pretending it seeded Postgres.
 */

import { loadEnv, style } from './_env.mjs';

loadEnv();

const { createPost, getPosts, isDatabaseConfigured } = await import('../lib/posts.js');
const { ensureSchema, closePool } = await import('../lib/db.js');

const force = process.argv.includes('--force');

const SAMPLE_PIECES = [
  {
    title: 'On the Keeping of Margins',
    author: 'A Quiet Reader',
    content: `Every book I have ever loved carries a second book inside it — the one I wrote in the margins. A pressed flower between pages 60 and 61. An argument with the author that runs four lines down and then, two chapters later, an apology.

We are told that reading is a private act. I think it is a conversation, badly annotated. You cannot see the other person, you cannot hear them, but you can feel where their pencil pressed a little too hard.

This is a place for that second book. Publish the note you would have scrawled, if the paper had been yours.`,
  },
  {
    title: 'Twelve Minutes of Rain',
    author: 'Hollis',
    content: `It rained for twelve minutes this afternoon and the whole street came outside to watch, as though weather were a guest we had been expecting. The barber stood in his doorway with a cup of coffee going cold. The dog from number nine barked at a puddle, then at nothing, then at me.

I keep meaning to write things down while they are happening, but there is a tax on that — the moment you lift the pen, you are describing rather than inside. So I stood there too, getting slightly wet, and did the describing afterwards.

Twelve minutes. Long enough to be worth remembering, short enough to be worth doubting.`,
  },
  {
    title: 'A Small Manifesto',
    author: 'Anonymous',
    content: `No accounts. No follower count. No notification that someone read page three and stopped.

Just a title, a name if you want one, and the thing itself.

Publish once, read twice, close the tab. That is the whole idea.`,
  },
  {
    title: 'How to Read a Poem You Do Not Understand Yet',
    author: 'Marguerite N.',
    content: `Read it aloud. Badly is fine; the mouth is a better instrument than the eye.

Read it again in a different room. Poems are sensitive to architecture.

Write the poem's title at the top of a blank page and leave the rest empty for three days. Whatever you put there on the fourth day is your poem, not theirs, and it will finally tell you what the original was doing.

If it never tells you, keep the page anyway. Some poems are for the keeping, not the cracking.`,
  },
  {
    title: 'The Library on Calle del Olvido',
    author: 'Tomas B.',
    content: `There is a library in my city that only opens when it rains, which is either a charming urban legend or a very good excuse for a librarian who dislikes sunshine. I went on Thursday. The door was unlocked. There was no one at the desk and no catalogue, only a handwritten card taped to the shelf: take one, leave the title of the one you took.

I took a book of letters between two people who never met. On the last page, in blue biro, someone had written: I hope this finds you well, whoever you are.

It found me well. I left the title of the one I took, and one of my own besides.`,
  },
  {
    title: 'Notes From a Very Slow Commute',
    author: 'Anonymous',
    content: `The 08:14 was cancelled, so I walked. Forty minutes along a road I have only ever seen through a bus window, and it turns out there is a whole street of shops between the two stops I take for granted.

A key cuttery. A tailor with one suit in the window and a sign that says ALTERATIONS WHILE YOU WAIT, PATIENCE REQUIRED. A bakery that sells, on Thursdays only, a loaf with olives and rosemary that I am now prepared to reorganise my week around.

Fourteen years of commuting and I had been living beside all of it, at speed.`,
  },
];

if (!isDatabaseConfigured()) {
  console.error(style.red('\nNo DATABASE_URL found — refusing to seed the demo store.\n'));
  console.error('  Copy .env.example to .env.local, add your Neon connection string, then');
  console.error('  run `npm run db:init && npm run db:seed`.\n');
  process.exit(1);
}

await ensureSchema();

const { posts: existing, source } = await getPosts({ limit: 1000 });

if (source === 'demo') {
  console.error(style.red('\nThe database could not be reached, so nothing was seeded.\n'));
  await closePool();
  process.exit(1);
}

if (existing.length > 0 && !force) {
  console.log(
    style.yellow(
      `\nThe posts table already has ${existing.length} ${existing.length === 1 ? 'piece' : 'pieces'} — nothing to do.`,
    ),
  );
  console.log(style.dim('  Pass --force to add the samples anyway:  npm run db:seed -- --force\n'));
  await closePool();
  process.exit(0);
}

let inserted = 0;

for (const piece of SAMPLE_PIECES) {
  const { post, source: writeSource, error } = await createPost(piece);

  if (writeSource !== 'database') {
    console.error(style.red(`\nFailed while inserting “${piece.title}”: ${error ?? 'unknown error'}\n`));
    await closePool();
    process.exit(1);
  }

  inserted += 1;
  console.log(`${style.green('✓')} ${post.title} ${style.dim(`— ${post.author}`)}`);
}

console.log(style.dim(`\n${inserted} pieces written to the posts table.`));
console.log(style.dim('Run `npm run dev`, or refresh the deployed feed.\n'));

await closePool();
process.exit(0);
