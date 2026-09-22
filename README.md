# Marginalia

A minimalist, signup-free publishing platform. Anyone can read, and anyone can publish — anonymously or under a pen name. No accounts, no emails, no password resets, no moderation queue.

Built with **Next.js (App Router)** and **Neon PostgreSQL**, styled with **Tailwind CSS v4**, deployable straight to **Vercel**.

```
Feed  ──▶  Publish a Story  ──▶  saved to Postgres  ──▶  back to the feed
```

---

## Contents

- [What it does](#what-it-does)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Database schema](#database-schema)
- [File structure](#file-structure)
- [Scripts](#scripts)
- [HTTP API](#http-api)
- [Deploying to Vercel](#deploying-to-vercel)
- [Design notes](#design-notes)
- [Troubleshooting](#troubleshooting)

---

## What it does

| | |
| --- | --- |
| **Reading feed** (`/`) | Every piece, newest first. Title, pen name, timestamp (absolute + "12 minutes ago"), reading time, word count. Short pieces are printed in full with a drop cap; longer ones show an excerpt and keep their own permalink. |
| **Publishing** (`/publish`) | Title, optional pen name (defaults to `Anonymous`) and the text itself. Validated on both sides, written straight to Postgres, then a redirect back to the feed where the new piece is confirmed and highlighted. Works **without JavaScript** too. |
| **Permalinks** (`/posts/[id]`) | Every piece gets a page of its own, with its own `<title>` and Open Graph tags. |
| **JSON API** (`/api/posts`, `/api/posts/:id`) | The same reads and writes, scriptable with `curl`. Plus `/api/health` for a one-line deployment check. |
| **No database?** | The app still runs: it falls back to a small in-memory store, says so in the UI, and tells you exactly how to fix it. Publish something silly, refresh, and it is gone — which is honestly the right behaviour for a demo. |

Not included, on purpose: authentication, user accounts, comment threads, likes, moderation filters, rate limiting, image uploads. This is the test build.

---

## Quick start

```bash
# 1. install
npm install

# 2. point it at a database
cp .env.example .env.local        # then paste your Neon connection string into DATABASE_URL

# 3. create the table (and optionally some sample pieces)
npm run db:init
npm run db:seed                   # optional: six sample pieces

# 4. run it
npm run dev                       # http://localhost:3000
```

No database yet? You can still run step 1 and 4 — the feed will appear with sample content from the in-memory demo store, and every page will carry a "Demo mode" notice. Set `DATABASE_URL` when you want things to persist.

**Requirements:** Node.js 20.9+ (22 LTS recommended), a Postgres database (Neon's free tier is ideal).

---

## Environment variables

All of them live in `.env.local` for development and in **Vercel → Project → Settings → Environment Variables** for production. Only the first one is required.

| Name | Required | Default | What it does |
| --- | --- | --- | --- |
| `DATABASE_URL` | **yes** | — | Postgres connection string. Use Neon's **pooled** endpoint (`…-pooler.….neon.tech`) so serverless functions do not exhaust connections. |
| `DATABASE_SSL` | no | auto | `require` or `disable`. Unset means: TLS for every non-localhost host, no TLS for localhost. |
| `PG_POOL_MAX` | no | `5` | Maximum clients in the connection pool. Keep it small on serverless. |
| `ALLOW_DELETES` | no | off | Set to `1` to enable `DELETE /api/posts/:id`. There is no authentication in this build, so anything you expose behind this switch is deletable by anyone with the URL. |
| `ALLOWED_DEV_ORIGINS` | no | — | Extra origins allowed to reach the dev server (comma separated), on top of the `*.e2b.app` / `*.vercel.app` defaults. |
| `SHOW_DB_STATUS` | no | off | Set to `1` to keep the little "postgres: connected" line visible in a production build. |

A Neon URL looks like this:

```
postgresql://USER:PASSWORD@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

> If your password contains `@`, `:`, `/` or `#`, URL-encode it (`@` → `%40`), or the connection string will not parse.

---

## Database schema

One table. That is the whole data model.

```sql
CREATE TABLE IF NOT EXISTS posts (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  author      TEXT DEFAULT 'Anonymous',
  content     TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- the feed reads ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts (created_at DESC);
```

Run it wherever you like:

- **In the Neon console** — paste the SQL above into the SQL Editor, or run `db/schema.sql`.
- **From the project** — `npm run db:init` (safe to repeat; uses `IF NOT EXISTS`).
- **Automatically** — the app creates the table on first publish if it is missing, so a fresh Neon project works even if you forget.

`db/schema.sql` is the canonical copy of this SQL, and `lib/db.js` exports it as `SCHEMA_SQL`/`CREATE_INDEX_SQL` so the app and your terminal can never disagree.

---

## File structure

```
marginalia/
├── app/
│   ├── (feed)/
│   │   ├── page.js               # the reading feed — /  (route group so the
│   │   └── loading.js            #   skeleton doesn't swallow 404 statuses)
│   ├── publish/
│   │   ├── page.js               # the publish form
│   │   └── actions.js            # `publishPost` server action (no-JS capable)
│   ├── posts/[id]/page.js        # one piece, with its own metadata
│   ├── api/
│   │   ├── posts/route.js        # GET all, POST new
│   │   ├── posts/[id]/route.js   # GET one, DELETE (opt-in)
│   │   └── health/route.js       # deployment / database probe
│   ├── layout.js                 # shell, fonts, metadata
│   ├── globals.css               # Tailwind v4 theme + component classes
│   ├── error.js / not-found.js   # error boundary + 404
│   └── fonts/                    # Inter + Newsreader (OFL), self-hosted
├── components/
│   ├── Masthead.js  SiteFooter.js
│   ├── PostCard.js               # one entry in the feed
│   ├── ArticleText.js            # paragraphs + drop cap
│   ├── EmptyFeed.js  DbStatus.js # empty state, "demo mode" honesty
│   └── PublishForm.js            # client form (useActionState)
├── lib/
│   ├── db.js                     # pool, TLS rules, SCHEMA_SQL, health check
│   ├── posts.js                  # getPosts / getPostById / createPost / deletePost
│   ├── demo-store.js             # in-memory fallback
│   ├── validation.js             # one place where input rules live
│   ├── format.js                 # dates, reading time, excerpts, paragraphs
│   └── constants.js              # limits, default author, site copy
├── scripts/
│   ├── _env.mjs                  # tiny .env loader for the CLI scripts
│   ├── db-init.mjs               # npm run db:init
│   ├── db-seed.mjs               # npm run db:seed
│   ├── db-reset.mjs              # npm run db:reset -- --force
│   └── verify.mjs                # npm run verify [-- --url https://…]
├── db/schema.sql                 # the SQL above
├── next.config.mjs               # serverExternalPackages: ['pg'], dev origins
└── .env.example
```

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (Next 16 no longer lints during `next build`) |
| `npm run check` | `lint` + `build` — what CI should run |
| `npm run db:init` | Create the `posts` table and index if missing |
| `npm run db:seed` | Insert six sample pieces (refuses to double-seed; `-- --force` overrides) |
| `npm run db:reset` | **Drops** the table and recreates it empty (`-- --force` required) |
| `npm run verify` | Preflight: env var, connection, table, row count. Add `-- --url https://your-app.vercel.app` to also probe the live deployment. Exits non-zero on failure, so it works as a CI gate. |

Each script prints what it is doing and why it failed. `verify` in particular is the fastest way to answer "is this deployment actually connected to Neon?".

---

## HTTP API

| Method | Route | Body | Response |
| --- | --- | --- | --- |
| `GET` | `/api/posts?limit=20` | — | `200 { posts, count, source, databaseConfigured }` |
| `POST` | `/api/posts` | `{ title, author?, content }` | `201 { post, source }` · `422 { errors }` · `400` for bad JSON |
| `GET` | `/api/posts/:id` | — | `200 { post, source }` · `404` · `400` for a non-numeric id |
| `DELETE` | `/api/posts/:id` | — | `200 { deleted }` when `ALLOW_DELETES=1`, otherwise `405` |
| `GET` | `/api/health` | — | `200 { ok, database: { configured, connected, server, error } }` |

`source` is `"database"` or `"demo"` — the second meaning "no database was reached, this is only in memory".

```bash
# publish something
curl -X POST https://your-app.vercel.app/api/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hello","author":"A Passing Stranger","content":"First line.\n\nSecond paragraph."}'

# read the five newest
curl 'https://your-app.vercel.app/api/posts?limit=5'
```

Validation lives in `lib/validation.js` and is applied identically by the API, the server action and the seed script: title required (≤ 160 chars), content required (≤ 20 000 chars), pen name optional (≤ 60 chars, falls back to `Anonymous`).

---

## Deploying to Vercel

### 1. Create the Neon database

1. Sign up at [neon.tech](https://neon.tech) and create a project (pick the region closest to your Vercel region).
2. In the Neon console press **Connect** and copy the **Pooled connection** string — it looks like `postgresql://…@ep-xxx-pooler.…neon.tech/neondb?sslmode=require`.
3. Optional: run `db/schema.sql` in Neon's SQL Editor, or let the app create the table on first publish.

### 2. Deploy the app

```bash
git push                                  # your repo
# then, in Vercel: Add New → Project → import the repo
```

Vercel detects Next.js automatically — no build settings to change. Before the first deploy (or right after), add the environment variable:

| Key | Value | Environments |
| --- | --- | --- |
| `DATABASE_URL` | your Neon pooled connection string | Production, Preview, Development |

Then redeploy so the variable is picked up. Optionally run `npm run db:init && npm run db:seed` locally against the same `DATABASE_URL` to give the live feed something to read.

### 3. Check it

```bash
npm run verify -- --url https://your-app.vercel.app
```

Or just open `https://your-app.vercel.app/api/health`. A healthy deployment answers:

```json
{ "ok": true, "database": { "configured": true, "connected": true, "server": "PostgreSQL 17.2" } }
```

More deployment detail, including how to swap in Neon's serverless driver or Vercel Postgres, is in [DEPLOY.md](DEPLOY.md).

---

## Design notes

A few decisions worth knowing before you change things:

**`pg`, not Neon's HTTP driver.** The standard `pg` driver speaks to Neon's pooled endpoint perfectly well, and the identical code also works against a local Postgres, a Vercel Postgres database or a CI container — which keeps this project testable anywhere. `serverExternalPackages: ['pg']` in `next.config.mjs` is required so the driver resolves its optional native pieces at runtime. The pool is cached on `globalThis`, so a warm serverless function reuses connections. (Swapping in `@neondatabase/serverless` is a small change — see DEPLOY.md.)

**The feed is always dynamic.** `export const dynamic = 'force-dynamic'` on the feed, the permalink and the publish page. A piece published one second ago must be visible in the next request; nothing here is worth caching, and Neon's pooled endpoint is designed for exactly this.

**Graceful degradation.** No database at all, or an unreachable one, is a supported state: reads and writes fall back to an in-memory store, the UI says so in an amber banner, and the failure is logged on the server — never rendered into the page, where a driver message could leak connection details.

**The publish form works without JavaScript.** It posts to a server action, which is also the create path in the API's own terms: the same validation, the same insert, the same fallback rules.

**Publishing is honestly confirmed.** On success the action redirects to `/?published=<id>#post-<id>`; the feed shows a confirmation line and the piece is highlighted by CSS `:target`, so the feedback survives JavaScript being off.

**Typography is self-hosted.** Inter and Newsreader (both OFL) ship in `app/fonts` and load via `next/font/local` — no request to any font CDN, at build time or for the reader. Licences are in the same directory. Prefer Google Fonts? It is a one-line swap per family, documented in `app/layout.js`.

**The root loading skeleton lives in `app/(feed)/loading.js`,** not `app/loading.js`. A root-level `loading.js` wraps every route in a Suspense boundary, which flushes the response shell with status 200 before `notFound()` can set 404 — so missing permalinks would answer 200. Scoping it to the feed route group keeps the skeleton and correct 404s.

---

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Amber "Demo mode" banner on the feed | `DATABASE_URL` is missing or unreachable. Check the server logs for `[marginalia] postgres query failed: …`. |
| `password authentication failed` | Wrong password, or a special character in it that needs URL-encoding (`@` → `%40`). |
| `relation "posts" does not exist` | Run `npm run db:init` (the app also self-heals on first publish). |
| `self-signed certificate` / TLS errors | Set `DATABASE_SSL=disable` for a local database, or `require` for a hosted one. |
| `SECURITY WARNING: The SSL modes 'prefer', 'require', …` in the logs | Not an error. `pg` 8 treats `sslmode=require` as `verify-full` and warns that `pg` 9 will change that. Swap to `sslmode=verify-full` for identical behaviour and quiet logs. |
| Build fails resolving `pg` | Keep `pg` in `dependencies` and `serverExternalPackages: ['pg']` in `next.config.mjs`. |
| Publishes vanish after a while | You are in demo mode (no database). See the first row. |
| Works locally, "Demo mode" on Vercel | `DATABASE_URL` is scoped to the wrong environment, or you have not redeployed since adding it. |
| `npm run db:*` fails with `MODULE_NOT_FOUND` | Those scripts need the `--conditions=react-server` flag that is already in `package.json` — run them through `npm run`, not `node` directly. |

---

## Licence

Application code: MIT. Bundled typefaces: SIL Open Font License 1.1 (`app/fonts/OFL-*.txt`).
