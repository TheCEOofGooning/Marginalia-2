/**
 * Presentation helpers: dates, reading time and excerpts.
 *
 * Dates are formatted in UTC on purpose so that a piece rendered on a Vercel
 * function (UTC) and one rendered on a laptop in another timezone never
 * disagree. `posts.created_at` is a `TIMESTAMP` column, which Postgres fills
 * with `CURRENT_TIMESTAMP` — i.e. UTC wall-clock time.
 */

const TIME_ZONE = 'UTC';
const LOCALE = 'en-US';

const longDate = new Intl.DateTimeFormat(LOCALE, {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: TIME_ZONE,
});

const dateTimeValue = new Intl.DateTimeFormat(LOCALE, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: TIME_ZONE,
  timeZoneName: 'short',
});

/** Coerce whatever the driver hands us (Date | ISO string) into a Date. */
function toDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export function formatDate(value) {
  const date = toDate(value);
  return date ? longDate.format(date) : '';
}

/** Full, machine readable timestamp for <time datetime="…"> attributes. */
export function toIsoString(value) {
  const date = toDate(value);
  return date ? date.toISOString() : '';
}

/** Human readable, absolute timestamp used in tooltips / bylines. */
export function formatDateTime(value) {
  const date = toDate(value);
  return date ? dateTimeValue.format(date) : '';
}

/** "just now", "12 minutes ago", "3 days ago", "2 months ago". */
export function formatRelative(value, now = Date.now()) {
  const date = toDate(value);
  if (!date) return '';

  const seconds = Math.round((now - date.getTime()) / 1000);
  if (seconds < 45) return 'just now';

  const units = [
    ['minute', 60],
    ['hour', 60],
    ['day', 24],
    ['week', 7],
    ['month', 4.348],
    ['year', 12],
  ];

  let amount = seconds / 60;
  let unit = 'minute';

  for (let i = 0; i < units.length; i += 1) {
    const [name, perNext] = units[i];
    unit = name;
    if (i === units.length - 1 || amount < perNext) break;
    amount /= perNext;
  }

  if (unit === 'minute' && amount < 1) amount = 1;
  const rounded = Math.max(1, Math.round(amount));
  return `${rounded} ${unit}${rounded === 1 ? '' : 's'} ago`;
}

export function wordCount(content) {
  if (typeof content !== 'string') return 0;
  const matches = content.trim().match(/[\p{L}\p{N}’'-]+/gu);
  return matches ? matches.length : 0;
}

/** Average adult reading speed for prose: ~220 words per minute. */
export function readingTime(content) {
  const minutes = Math.max(1, Math.round(wordCount(content) / 220));
  return `${minutes} min read`;
}

/** Short preview used when a piece is too long to print in the feed. */
export function excerpt(content, max = 280) {
  if (typeof content !== 'string') return '';
  const flat = content.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;

  const clipped = flat.slice(0, max);
  const lastSpace = clipped.lastIndexOf(' ');
  const words = lastSpace > max * 0.6 ? clipped.slice(0, lastSpace) : clipped;
  return `${words.replace(/[,;:.\-–—]$/, '')}…`;
}

/** Split stored text into paragraphs for the reading view. */
export function toParagraphs(content) {
  if (typeof content !== 'string') return [];
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
