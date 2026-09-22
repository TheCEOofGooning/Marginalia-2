-- ============================================================================
-- Marginalia — database schema
--
-- Run this against your Neon database (SQL Editor in the Neon console),
-- or let the app create it for you:  `npm run db:init`
-- Both paths run byte-for-byte the same SQL, which lives in lib/db.js.
-- ============================================================================

CREATE TABLE IF NOT EXISTS posts (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  author      TEXT DEFAULT 'Anonymous',
  content     TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- The feed always reads `ORDER BY created_at DESC`; this index keeps it fast as
-- the archive grows.
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts (created_at DESC);

-- ----------------------------------------------------------------------------
-- Optional: a few pieces so a fresh database does not look broken.
-- `npm run db:seed` inserts nicer ones (and refuses to run twice by accident).
-- ----------------------------------------------------------------------------
-- INSERT INTO posts (title, author, content) VALUES
--   ('A Small Manifesto', 'Anonymous', 'No accounts. No follower count. Just a title, a name if you want one, and the thing itself.');
