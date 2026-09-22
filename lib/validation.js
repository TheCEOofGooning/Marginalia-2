/**
 * Input validation and normalisation for published pieces.
 *
 * Every write path — the JSON API, the no-JavaScript form fallback and the
 * seed scripts — goes through `validatePostInput()` so the rules only live in
 * one place. No authentication, no moderation: we only make sure the data that
 * reaches Postgres is sane and safe.
 */

import { DEFAULT_AUTHOR, LIMITS } from './constants.js';

/** Collapse runs of whitespace so a title can never contain line breaks. */
function squash(input) {
  return input.replace(/\s+/g, ' ').trim();
}

/**
 * Keep paragraph breaks, but normalise line endings and trim runaway blank
 * lines so a piece renders predictably wherever it is displayed.
 */
export function normalizeContent(input) {
  return input
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * @param {{ title?: unknown, author?: unknown, content?: unknown }} input
 * @returns {{ ok: boolean, errors: Record<string,string>, value: { title: string, author: string, content: string } }}
 */
export function validatePostInput(input = {}) {
  const rawTitle = typeof input.title === 'string' ? input.title : '';
  const rawAuthor = typeof input.author === 'string' ? input.author : '';
  const rawContent = typeof input.content === 'string' ? input.content : '';

  const title = squash(rawTitle);
  const author = squash(rawAuthor).slice(0, LIMITS.author) || DEFAULT_AUTHOR;
  const content = normalizeContent(rawContent);

  const errors = {};

  if (!title) {
    errors.title = 'Every piece needs a title.';
  } else if (title.length > LIMITS.title) {
    errors.title = `Titles are limited to ${LIMITS.title} characters.`;
  }

  if (rawAuthor.trim().length > LIMITS.author) {
    errors.author = `Pen names are limited to ${LIMITS.author} characters.`;
  }

  if (!content) {
    errors.content = 'There is nothing to publish yet.';
  } else if (content.length > LIMITS.content) {
    errors.content = `Pieces are limited to ${LIMITS.content.toLocaleString('en-US')} characters.`;
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: { title, author, content },
  };
}

/** Parse a route parameter / query string value into a positive integer id. */
export function parsePostId(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value !== 'string' || !/^\d{1,12}$/.test(value.trim())) return null;
  const id = Number.parseInt(value.trim(), 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
