/**
 * Shared constants for Marginalia.
 *
 * Kept dependency-free so both server code and client components can import it.
 */

/** Used whenever a writer leaves the pen name field empty. */
export const DEFAULT_AUTHOR = 'Anonymous';

/** The name of the database table that stores everything published here. */
export const POSTS_TABLE = 'posts';

/**
 * Field limits. These are enforced in two places:
 *   1. `lib/validation.js` (server-side, authoritative)
 *   2. `components/PublishForm.js` (client-side, for fast feedback)
 */
export const LIMITS = {
  title: 160,
  author: 60,
  content: 20000,
};

/** how many pieces the feed will load in one pass */
export const FEED_LIMIT = 100;

/** posts shorter than this are shown in full inside the feed */
export const INLINE_FULL_TEXT_LIMIT = 480;

export const SITE = {
  name: 'Marginalia',
  tagline: 'A quiet place to read and publish.',
  description:
    'Marginalia is a signup-free publishing space. No accounts, no metrics — just writing, published instantly under your own pen name or none at all.',
};
