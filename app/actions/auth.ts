'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { safeNext } from '@/lib/auth';
import { hasSupabase, NOT_CONFIGURED, SITE_URL } from '@/lib/env';
import { normalisePhone } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types';

function origin() {
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'https';
  return host ? `${proto}://${host}` : SITE_URL;
}

export async function signIn(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  if (!hasSupabase) return { ok: false, error: NOT_CONFIGURED };
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  if (!email || !password) return { ok: false, error: 'Enter your email and password.' };
  const { error } = await createClient().auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message === 'Invalid login credentials' ? 'That email and password don’t match an account.' : error.message };
  redirect(safeNext(String(form.get('next') || '')));
}

const SignUp = z.object({
  full_name: z.string().trim().min(2, 'Add your full name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z.string().trim().min(7, 'Add your phone number.'),
  password: z.string().min(8, 'Use at least 8 characters for your password.'),
});

export async function signUp(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  if (!hasSupabase) return { ok: false, error: NOT_CONFIGURED };
  const parsed = SignUp.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const phone = normalisePhone(parsed.data.phone);
  if (!phone) return { ok: false, error: 'Enter a Nigerian phone number, e.g. 0803 555 0142 or +234 803 555 0142.' };
  const next = safeNext(String(form.get('next') || ''));
  const { data, error } = await createClient().auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name, phone },
      emailRedirectTo: `${origin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { ok: false, error: error.message };
  if (data.session) redirect(next);
  return { ok: true, message: `Check ${parsed.data.email} for a link to verify your email. You can browse while you wait.` };
}

export async function signInWithGoogle(form: FormData) {
  if (!hasSupabase) redirect('/login?error=not-configured');
  const next = safeNext(String(form.get('next') || ''));
  const { data, error } = await createClient().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect('/login?error=google');
  redirect(data.url);
}

export async function requestReset(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  if (!hasSupabase) return { ok: false, error: NOT_CONFIGURED };
  const email = String(form.get('email') || '').trim();
  if (!email) return { ok: false, error: 'Enter your email address.' };
  await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${origin()}/auth/callback?next=/reset-password/new` });
  return { ok: true, message: `If ${email} has an account, a reset link is on its way.` };
}

export async function updatePassword(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const password = String(form.get('password') || '');
  if (password.length < 8) return { ok: false, error: 'Use at least 8 characters.' };
  const { error } = await createClient().auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  redirect('/account');
}

export async function signOut() {
  if (hasSupabase) await createClient().auth.signOut();
  redirect('/');
}
