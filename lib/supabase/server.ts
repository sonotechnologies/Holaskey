import 'server-only';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createPlainClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../env';

/** Supabase client acting as the signed-in user (RLS applies). */
export function createClient(): SupabaseClient {
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(list: { name: string; value: string; options: CookieOptions }[]) {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component; middleware refreshes the session instead.
        }
      },
    },
  });
}

/** Anonymous client for public catalogue reads that don't need the session (cacheable). */
export function createPublicClient(): SupabaseClient {
  return createPlainClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
}

/**
 * Service-role client. Bypasses RLS — only for server code that has already checked
 * who is calling (webhooks, order creation, state changes the customer is allowed to make).
 */
export function createServiceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return createPlainClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
