// Public address of the site. On Vercel it falls back to the project's production domain,
// so link previews (WhatsApp, Instagram, X) never point at localhost.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || (vercelHost ? `https://${vercelHost}` : 'http://localhost:3000')).replace(/\/$/, '');

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Supabase's newer "publishable" key replaces the legacy "anon" key; either name works.
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/** True once Supabase env vars are set. Without them the site runs on sample data, read-only. */
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const NOT_CONFIGURED =
  'The store backend is not connected yet. Add the Supabase keys to the environment to enable accounts, cart and orders.';
