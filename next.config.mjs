/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Keep the Postgres driver out of the bundler. `pg` looks for optional
   * native/Cloudflare bits at runtime, which only resolves if it stays a normal
   * Node dependency — this is what makes `npm run build` work on Vercel.
   */
  serverExternalPackages: ['pg'],

  /**
   * Dev-only. Allows the dev server to be reached through a proxied preview
   * host (and any origin you add below) without Next.js blocking the request.
   * Extra hosts can be passed as a comma-separated list in ALLOWED_DEV_ORIGINS.
   */
  allowedDevOrigins: [
    '*.e2b.app',
    '*.vercel.app',
    ...(process.env.ALLOWED_DEV_ORIGINS?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []),
  ],

  // NB: Next 16 no longer runs ESLint during `next build`, so lint is a separate
  // step — `npm run lint` (or `npm run check`, which does lint + build).
  poweredByHeader: false,
};

export default nextConfig;
