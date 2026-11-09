'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getViewer } from '@/lib/auth';
import { normalisePhone } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import { parseMeasurements } from '@/lib/measure';
import type { ActionResult } from '@/lib/types';

async function viewerOrLogin(next: string) {
  const v = await getViewer();
  if (!v) redirect(`/login?next=${encodeURIComponent(next)}`);
  return v;
}

export async function updateProfile(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const v = await viewerOrLogin('/account');
  const full_name = String(form.get('full_name') || '').trim();
  const phone = normalisePhone(String(form.get('phone') || ''));
  if (full_name.length < 2) return { ok: false, error: 'Add your full name.' };
  if (!phone) return { ok: false, error: 'Enter a Nigerian phone number, e.g. 0803 555 0142.' };
  const { error } = await createClient().from('profiles').update({ full_name, phone }).eq('user_id', v.id);
  if (error) return { ok: false, error: 'Could not save. Try again.' };
  revalidatePath('/account', 'layout');
  return { ok: true, message: 'Saved.' };
}

const AddressSchema = z.object({
  label: z.string().trim().max(30).default('Home'),
  recipient: z.string().trim().min(2, 'Add the full name for delivery.'),
  phone: z.string().trim().min(7, 'Add a phone number.'),
  state: z.string().trim().min(2, 'Choose a state.'),
  city: z.string().trim().min(2, 'Add a city.'),
  street: z.string().trim().min(4, 'Add a street address.'),
  landmark: z.string().trim().default(''),
});

export async function saveAddress(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const v = await viewerOrLogin('/account/addresses');
  const parsed = AddressSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const phone = normalisePhone(parsed.data.phone);
  if (!phone) return { ok: false, error: 'Enter a Nigerian phone number, e.g. 0803 555 0142.' };
  const supabase = createClient();
  const id = String(form.get('id') || '');
  const makeDefault = form.get('is_default') === 'on';
  const { count } = await supabase.from('addresses').select('id', { count: 'exact', head: true }).eq('user_id', v.id);
  if (makeDefault || !count) await supabase.from('addresses').update({ is_default: false }).eq('user_id', v.id);
  const row = { ...parsed.data, phone, user_id: v.id, is_default: makeDefault || !count };
  const { error } = id
    ? await supabase.from('addresses').update(row).eq('id', id).eq('user_id', v.id)
    : await supabase.from('addresses').insert(row);
  if (error) return { ok: false, error: 'Could not save the address. Try again.' };
  revalidatePath('/account/addresses');
  redirect('/account/addresses');
}

export async function deleteAddress(id: string) {
  const v = await viewerOrLogin('/account/addresses');
  await createClient().from('addresses').delete().eq('id', id).eq('user_id', v.id);
  revalidatePath('/account/addresses');
}

export async function setDefaultAddress(id: string) {
  const v = await viewerOrLogin('/account/addresses');
  const supabase = createClient();
  await supabase.from('addresses').update({ is_default: false }).eq('user_id', v.id);
  await supabase.from('addresses').update({ is_default: true }).eq('id', id).eq('user_id', v.id);
  revalidatePath('/account/addresses');
}

export async function saveMeasurements(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const v = await viewerOrLogin('/account/measurements');
  const m = parseMeasurements(form);
  const { error } = await createClient().from('measurements').upsert({ user_id: v.id, ...m }, { onConflict: 'user_id' });
  if (error) return { ok: false, error: 'Could not save your measurements. Try again.' };
  revalidatePath('/account/measurements');
  return { ok: true, message: 'Saved. These prefill your next custom order.' };
}
