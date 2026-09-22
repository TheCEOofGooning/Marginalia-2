# Deploying Marginalia

Step-by-step for Vercel + Neon, plus the optional driver swap and alternative databases.
For local setup and the file-by-file tour, see [README.md](README.md).

---

## 1. Neon: create the database

1. Create a project at [neon.tech](https://neon.tech) (free tier is plenty).
2. Choose the region closest to where your Vercel functions run — a feed page does one round trip per view, so distance is the main cost.
3. Press **Connect** and copy the **Pooled connection** string:

   ```
   postgresql://USER:PASSWORD@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

   The `-pooler` host goes through PgBouncer, which is what you want from serverless functions. The direct (non-pooled) host also works; it just opens more connections.

4. Create the table. Either paste `db/schema.sql` into the Neon **SQL Editor**, or from your machine:

   ```bash
   cp .env.example .env.local     # paste the connection string into DATABASE_URL
   npm run db:init
   npm run db:seed                # optional, six sample pieces
   ```

   You can skip this — the app creates the table on the first publish — but doing it up front means the first deploy has content to show.

---

## 2. Vercel: deploy

1. Push the repository to GitHub/GitLab/Bitbucket.
2. In Vercel: **Add New → Project → import the repository**. Framework preset, build command and output are detected automatically (`next build`); nothing to configure.
3. Under **Settings → Environment Variables**, add:

   | Name | Value | Environments |
   | --- | --- | --- |
   | `DATABASE_URL` | the Neon pooled connection string | Production, Preview, Development |

   Optional extras, all documented in `.env.example`: `DATABASE_SSL`, `PG_POOL_MAX`, `ALLOW_DELETES`, `ALLOWED_DEV_ORIGINS`, `SHOW_DB_STATUS`.
4. **Deploy.** If you added the variable after the first build, either redeploy or hit *Redeploy* in the deployment's menu so the new environment is picked up.

### Verify the deployment

```bash
npm run verify -- --url https://your-app.vercel.app
```

Expected tail:

```
✓ DATABASE_URL  host ep-xxx-pooler.eu-central-1.aws.neon.tech
✓ connection  41 ms · PostgreSQL 17.2
✓ posts table  6 stored
✓ https://your-app.vercel.app/api/health  database connected · PostgreSQL 17.2
✓ https://your-app.vercel.app/api/posts  5 returned · newest: “…” · source: database
```

`source: database` is the line that matters. If you see `source: demo`, the deployment is running on the in-memory fallback — check the environment variable name and that it is enabled for the right environment.

---

## 3. Pooling, cold starts and limits

- **Use the pooled endpoint** (`…-pooler.…`) for `DATABASE_URL`. Vercel functions scale horizontally; pooler + `PG_POOL_MAX=5` keeps the connection count civil.
- **The pool is cached per function instance** on `globalThis`. A cold start opens one connection, and warm invocations reuse it — no connect-per-request.
- **`max` matters more than you think** on serverless. Five clients per instance is a sensible ceiling; Neon's pooler multiplexes on top of that.
- **Nothing is cached in Next.js**: the feed, the permalink and the publish page are `force-dynamic`. Adding `revalidate` would trade freshness for speed — fine for a read-mostly magazine, wrong for this one.
- **Neon autosuspend** (free tier) means the first request after idle pays a wake-up: typically a second or two. The `loading.js` skeleton exists partly for that.

---

## 4. Optional: use Neon's serverless driver instead of `pg`

Marginalia ships with `pg` because the same code then runs against Neon, a local Postgres or a CI container. If you specifically want Neon's HTTP/WebSocket driver (useful in edge runtimes, or to avoid TCP sockets entirely):

```bash
npm install @neondatabase/serverless
```

Replace the driver setup in `lib/db.js`:

```diff
-import pg from 'pg';
+import { Pool } from '@neondatabase/serverless';
```

and drop the `serverExternalPackages: ['pg']` line from `next.config.mjs` (and `pg` from `package.json`) if nothing else needs it. Everything else — `lib/posts.js`, the API routes, the server action, the scripts — stays exactly as it is, because they only ever call `execute()`.

Neon's HTTP driver does not support TLS options the way `pg` does, so `DATABASE_SSL` becomes irrelevant on that path.

---

## 5. Other databases

| Provider | What to change |
| --- | --- |
| **Vercel Postgres** | Use the `POSTGRES_URL` (pooled) value from the project's Storage tab as `DATABASE_URL`. No code change. |
| **Supabase** | Use the *Connection pooling* string (port `6543`). If the project's certificate chain complains, set `DATABASE_SSL=require`. |
| **Local Postgres** | `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marginalia`, then `npm run db:init`. TLS is disabled automatically for localhost. |
| **CI / tests** | Any Postgres (service container, `postgres:17` image) works; point `DATABASE_URL` at it and run `npm run db:init`. |

---

## 6. Post-deploy checklist

- [ ] `https://your-app.vercel.app/api/health` returns `"connected": true`
- [ ] The feed shows exactly the pieces you expect (`npm run verify -- --url …`)
- [ ] Publish one throwaway piece through the UI and confirm it appears at the top of the feed
- [ ] Confirm the "Demo mode" banner is **absent**
- [ ] Decide about `ALLOW_DELETES` (leave it off unless you want the whole world to be able to delete)
- [ ] Add a custom domain if you want one (Vercel → Domains)
