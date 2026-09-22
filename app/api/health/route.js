/**
 * Liveness probe for the deployment.
 *
 *   GET /api/health → 200 { ok: true, database: {...} }
 *
 * `npm run verify` (and anyone debugging a Vercel deploy) can hit this to see
 * whether DATABASE_URL is set, whether Postgres answers, and which version it
 * is — without reading server logs.
 */

import { NextResponse } from 'next/server';

import { checkConnection, isDatabaseConfigured } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const database = await checkConnection();
  const ok = database.ok;

  return NextResponse.json(
    {
      ok,
      app: 'marginalia',
      timestamp: new Date().toISOString(),
      database: {
        configured: isDatabaseConfigured(),
        connected: database.ok,
        server: database.server,
        error: database.error,
      },
      hint: ok
        ? undefined
        : 'Set DATABASE_URL (Neon → Connect → pooled connection string) and run `npm run db:init`. Until then Marginalia serves an in-memory demo store.',
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
