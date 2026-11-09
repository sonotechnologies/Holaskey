'use server';
import { z } from 'zod';
import { hasSupabase, NOT_CONFIGURED } from '@/lib/env';
import { createPublicClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types';

export async function joinNewsletter(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const email = z.string().trim().toLowerCase().email().safeParse(form.get('email'));
  if (!email.success) return { ok: false, error: 'Enter a valid email address.' };
  if (!hasSupabase) return { ok: false, error: NOT_CONFIGURED };
  const { error } = await createPublicClient().from('newsletter_signups').insert({ email: email.data });
  if (error && error.code !== '23505') return { ok: false, error: 'Could not sign you up. Try again.' };
  return { ok: true, message: "You're on the list. First to the drop." };
}
