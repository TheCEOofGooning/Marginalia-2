/**
 * In-memory demo store.
 *
 * Marginalia talks to Neon. When no DATABASE_URL is configured (for example
 * when you first clone the repo, or in a CI smoke test) the app falls back to
 * this tiny in-memory store so every page still renders and "publishing" still
 * works for the lifetime of the server process. `lib/posts.js` is the only
 * module that decides which backend to use.
 */

import { DEFAULT_AUTHOR } from './constants.js';
import { normalizeContent } from './validation.js';

/** Seed content, written for the demo store only. */
const SEED = [
  {
    id: 1,
    title: 'On the Keeping of Margins',
    author: 'A Quiet Reader',
    content: `Every book I have ever loved carries a second book inside it — the one I wrote in the margins. A pressed flower between pages 60 and 61. An argument with the author that runs four lines down and then, two chapters later, an apology.

We are told that reading is a private act. I think it is a conversation, badly annotated. You cannot see the other person, you cannot hear them, but you can feel where their pencil pressed a little too hard.

This is a place for that second book. Publish the note you would have scrawled, if the paper had been yours.`,
  },
  {
    id: 2,
    title: 'Twelve Minutes of Rain',
    author: 'Hollis',
    content: `It rained for twelve minutes this afternoon and the whole street came outside to watch, as though weather were a guest we had been expecting. The barber stood in his doorway with a cup of coffee going cold. The dog from number nine barked at a puddle, then at nothing, then at me.

I keep meaning to write things down while they are happening, but there is a tax on that — the moment you lift the pen, you are describing rather than inside. So I stood there too, getting slightly wet, and did the describing afterwards.

Twelve minutes. Long enough to be worth remembering, short enough to be worth doubting.`,
  },
  {
    id: 3,
    title: 'A Small Manifesto',
    author: DEFAULT_AUTHOR,
    content: `No accounts. No follower count. No notification that someone read page three and stopped.

Just a title, a name if you want one, and the thing itself.

Publish once, read twice, close the tab. That is the whole idea.`,
  },
  {
    id: 4,
    title: 'How to Read a Poem You Do Not Understand Yet',
    author: 'Marguerite N.',
    content: `Read it aloud. Badly is fine; the mouth is a better instrument than the eye.

Read it again in a different room. Poems are sensitive to architecture.

Write the poem's title at the top of a blank page and leave the rest empty for three days. Whatever you put there on the fourth day is your poem, not theirs, and it will finally tell you what the original was doing.

If it never tells you, keep the page anyway. Some poems are for the keeping, not the cracking.`,
  },
];

/** Deep-ish copy so callers can never mutate the seed array by accident. */
function copyPost(post) {
  return {
    id: post.id,
    title: post.title,
    author: post.author || DEFAULT_AUTHOR,
    content: post.content,
    created_at: post.created_at,
  };
}

/**
 * The demo database lives on `globalThis`, not in module scope: Next.js can
 * evaluate a module more than once (server components, route handlers, dev
 * hot-reloads) and hot reloads would otherwise reset everything you published.
 */
function getState() {
  if (!globalThis.__marginaliaDemoStore) {
    const now = Date.now();
    globalThis.__marginaliaDemoStore = {
      nextId: SEED.length + 1,
      posts: SEED.map((post, index) => ({
        ...copyPost(post),
        // stagger the seed timestamps so the feed reads like a real archive
        created_at: new Date(now - (index + 1) * 1000 * 60 * 37 - index * 1000 * 60 * 60),
      })),
    };
  }
  return globalThis.__marginaliaDemoStore;
}

export function listPosts({ limit = 100 } = {}) {
  const { posts } = getState();
  return [...posts]
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    .slice(0, limit)
    .map((post) => ({ ...copyPost(post), created_at: new Date(post.created_at) }));
}

export function findPost(id) {
  const { posts } = getState();
  const post = posts.find((candidate) => candidate.id === Number(id));
  return post ? { ...copyPost(post), created_at: new Date(post.created_at) } : null;
}

export function deletePost(id) {
  const state = getState();
  const index = state.posts.findIndex((candidate) => candidate.id === Number(id));
  if (index === -1) return false;
  state.posts.splice(index, 1);
  return true;
}

export function createPost({ title, author, content }) {
  const state = getState();
  const post = {
    id: state.nextId,
    title,
    author: author || DEFAULT_AUTHOR,
    content: normalizeContent(content),
    created_at: new Date(),
  };
  state.nextId += 1;
  state.posts.push(post);
  return { ...copyPost(post) };
}
