import 'server-only';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { hasSupabase } from './env';
import { createClient } from './supabase/server';

export interface Viewer {
  id: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  phone: string;
  role: 'customer' | 'admin';
}

/** The signed-in user with their profile, or null. Cached per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!hasSupabase) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, role')
    .eq('user_id', user.id)
    .maybeSingle();
  return {
    id: user.id,
    email: user.email ?? '',
    emailVerified: Boolean(user.email_confirmed_at),
    fullName: profile?.full_name || (user.user_metadata?.full_name as string) || '',
    phone: profile?.phone ?? '',
    role: profile?.role === 'admin' ? 'admin' : 'customer',
  };
});

export async function requireViewer(next: string): Promise<Viewer> {
  const v = await getViewer();
  if (!v) redirect(`/login?next=${encodeURIComponent(next)}`);
  return v;
}

export async function requireAdmin(): Promise<Viewer> {
  const v = await getViewer();
  if (!v) redirect('/login?next=/admin');
  if (v.role !== 'admin') redirect('/');
  return v;
}

/** Only allow same-site relative redirects after login. */
export function safeNext(next: string | null | undefined, fallback = '/account'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback;
  return next;
}
