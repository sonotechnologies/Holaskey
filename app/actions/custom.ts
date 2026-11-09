'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getViewer } from '@/lib/auth';
import { emails, OWNER_EMAIL } from '@/lib/email';
import { SITE_URL } from '@/lib/env';
import { CLOTHING_TYPES, SHOE_TYPES } from '@/lib/custom';
import { parseNaira } from '@/lib/format';
import { MAX_REFS } from '@/lib/images';
import { hasClothingMeasurements, parseMeasurements } from '@/lib/measure';
import { userEmail } from '@/lib/payments';
import { initializeTransaction, newReference } from '@/lib/paystack';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types';


const Request = z.object({
  request_id: z.string().uuid(),
  kind: z.enum(['clothing', 'shoes'], { errorMap: () => ({ message: 'Choose clothing or shoes.' }) }),
  item_type: z.string().min(1, 'Choose an item type.'),
  description: z.string().trim().min(3, 'Describe what you want made.').max(1000, 'Keep the description under 1,000 characters.'),
  colour_material: z.string().trim().max(200).default(''),
  needed_by: z.string().optional(),
  product_slug: z.string().optional(),
});

export async function submitCustomRequest(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) redirect('/login?next=/custom');
  const parsed = Request.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (!(d.kind === 'clothing' ? CLOTHING_TYPES : SHOE_TYPES).includes(d.item_type)) return { ok: false, error: 'Choose an item type.' };

  // Photos were uploaded straight to storage; only accept paths inside this user's folder for this request.
  const prefix = `${viewer.id}/${d.request_id}/`;
  let photos: { path: string; note: string }[];
  try {
    photos = JSON.parse(String(form.get('photos') || '[]'));
  } catch {
    photos = [];
  }
  photos = photos.filter((p) => typeof p.path === 'string' && p.path.startsWith(prefix) && !p.path.includes('..')).slice(0, MAX_REFS);
  if (!photos.length) return { ok: false, error: 'Add at least one photo of what you want.' };

  const supabase = createClient();
  const { data: stored } = await supabase.storage.from('custom-refs').list(`${viewer.id}/${d.request_id}`);
  const names = new Set((stored ?? []).map((o) => o.name));
  photos = photos.filter((p) => names.has(p.path.slice(prefix.length)));
  if (!photos.length) return { ok: false, error: 'Your photos did not finish uploading. Add them again.' };

  let needed_by: string | null = null;
  if (d.needed_by) {
    const min = new Date();
    min.setDate(min.getDate() + 7);
    if (new Date(d.needed_by + 'T23:59:59') < min) return { ok: false, error: 'Pick a date at least 7 days from today.' };
    needed_by = d.needed_by;
  }
  const budget_min = parseNaira(String(form.get('budget_min') || ''));
  const budget_max = parseNaira(String(form.get('budget_max') || ''));
  if (budget_min && budget_max && budget_min > budget_max) return { ok: false, error: 'The lowest budget is higher than the highest.' };

  const m = parseMeasurements(form);
  const measurements =
    d.kind === 'clothing'
      ? { chest: m.chest, waist: m.waist, hips: m.hips, shoulder: m.shoulder, sleeve: m.sleeve, length: m.length, inseam: m.inseam }
      : { shoe_system: m.shoe_system, shoe_size: m.shoe_size, foot_length_cm: m.foot_length_cm };
  if (d.kind === 'shoes' && !m.shoe_size) return { ok: false, error: 'Choose your shoe size.' };
  if (d.kind === 'clothing' && !hasClothingMeasurements(m)) return { ok: false, error: 'Add at least your chest or waist measurement.' };

  let product_id: string | null = null;
  if (d.product_slug) {
    const { data: p } = await supabase.from('products').select('id').eq('slug', d.product_slug).maybeSingle();
    product_id = p?.id ?? null;
  }

  const { data: req, error } = await supabase
    .from('custom_requests')
    .insert({
      id: d.request_id,
      user_id: viewer.id,
      kind: d.kind,
      item_type: d.item_type,
      description: d.description,
      colour_material: d.colour_material,
      measurements,
      product_id,
      budget_min,
      budget_max,
      needed_by,
      status: 'submitted',
    })
    .select('id, number')
    .single();
  if (error || !req) return { ok: false, error: 'Could not send your request. Try again.' };

  await supabase.from('custom_request_images').insert(
    photos.map((p) => ({ request_id: req.id, path: p.path, note: String(p.note || '').slice(0, 120), kind: 'reference', uploaded_by: viewer.id })),
  );
  if (form.get('save_measurements') === 'on') {
    await supabase.from('measurements').upsert({ user_id: viewer.id, ...m }, { onConflict: 'user_id' });
  }
  await createServiceClient().from('status_events').insert({ entity: 'custom', entity_id: req.id, to_status: 'submitted', actor_id: viewer.id });

  await Promise.all([
    emails.customReceived(viewer.email, { number: req.number, id: req.id }),
    OWNER_EMAIL && emails.customReceivedOwner({ number: req.number, id: req.id, kind: d.kind, item_type: d.item_type, customer: viewer.fullName || viewer.email }),
  ]);
  redirect(`/custom/submitted?id=${req.id}`);
}

async function loadOwnRequest(id: string) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=/account/custom/${id}`);
  const { data: r } = await createClient().from('custom_requests').select('*').eq('id', id).eq('user_id', viewer.id).maybeSingle();
  return { viewer, r };
}

export async function payQuote(id: string): Promise<ActionResult> {
  const { viewer, r } = await loadOwnRequest(id);
  if (!r) return { ok: false, error: 'Request not found.' };
  if (r.status !== 'quoted') return { ok: false, error: 'This quote can no longer be paid.' };
  if (!r.quote_expires_at || new Date(r.quote_expires_at) < new Date()) {
    await createServiceClient().from('custom_requests').update({ status: 'expired' }).eq('id', r.id).eq('status', 'quoted');
    revalidatePath(`/account/custom/${id}`);
    return { ok: false, error: 'This quote has expired. Send us a message and we’ll re-quote.' };
  }
  if (!viewer.emailVerified) return { ok: false, error: 'Verify your email address before paying. Check your inbox for the link.' };
  if (!process.env.PAYSTACK_SECRET_KEY) return { ok: false, error: 'Payments are not set up yet.' };
  const total = (r.quote_amount ?? 0) + (r.quote_delivery ?? 0);
  const reference = newReference('HLKC');
  await createServiceClient().from('custom_requests').update({ paystack_ref: reference }).eq('id', r.id);
  let url: string;
  try {
    url = await initializeTransaction({
      email: viewer.email,
      amount: total,
      reference,
      callbackUrl: `${SITE_URL}/account/custom/${r.id}?reference=${reference}`,
      metadata: { kind: 'custom', request_id: r.id, request_number: r.number, user_id: viewer.id },
    });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  redirect(url);
}

export async function declineQuote(id: string): Promise<ActionResult> {
  const { viewer, r } = await loadOwnRequest(id);
  if (!r || r.status !== 'quoted') return { ok: false, error: 'This quote can no longer be declined.' };
  const db = createServiceClient();
  await db.from('custom_requests').update({ status: 'declined' }).eq('id', r.id);
  await db.from('status_events').insert({ entity: 'custom', entity_id: r.id, from_status: 'quoted', to_status: 'declined', actor_id: viewer.id });
  revalidatePath(`/account/custom/${id}`);
  return { ok: true };
}

/** A message on a request's thread, from the customer or from the owner (admin). */
export async function sendCustomMessage(id: string, body: string, imagePaths: string[]): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=/account/custom/${id}`);
  const text = body.trim().slice(0, 2000);
  const supabase = createClient();
  const { data: r } = await supabase.from('custom_requests').select('id, number, user_id, status').eq('id', id).maybeSingle();
  if (!r) return { ok: false, error: 'Request not found.' };
  const isAdmin = viewer.role === 'admin';
  if (!isAdmin && r.user_id !== viewer.id) return { ok: false, error: 'Request not found.' };
  const prefix = `${r.user_id}/${r.id}/`;
  const images = imagePaths.filter((p) => p.startsWith(prefix) && !p.includes('..')).slice(0, 5);
  if (!text && !images.length) return { ok: false, error: 'Write a message or attach a photo.' };

  const { error } = await supabase.from('custom_messages').insert({ request_id: r.id, sender_id: viewer.id, from_admin: isAdmin, body: text, image_paths: images });
  if (error) return { ok: false, error: 'Could not send. Try again.' };

  const db = createServiceClient();
  if (isAdmin && images.length) {
    await db.from('custom_request_images').insert(images.map((path) => ({ request_id: r.id, path, kind: 'progress', uploaded_by: viewer.id })));
  }
  // The customer answered a question: back to the owner's inbox.
  if (!isAdmin && r.status === 'needs_info') {
    await db.from('custom_requests').update({ status: 'submitted' }).eq('id', r.id);
    await db.from('status_events').insert({ entity: 'custom', entity_id: r.id, from_status: 'needs_info', to_status: 'submitted', note: 'Customer replied', actor_id: viewer.id });
  }
  if (isAdmin) {
    const to = await userEmail(r.user_id);
    if (to) await emails.newMessage(to, { number: r.number, href: `${SITE_URL}/account/custom/${r.id}`, from: 'HOLASKEY' });
  } else if (OWNER_EMAIL) {
    await emails.newMessage(OWNER_EMAIL, { number: r.number, href: `${SITE_URL}/admin/custom/${r.id}`, from: viewer.fullName || 'The customer' });
  }
  revalidatePath(`/account/custom/${id}`);
  revalidatePath(`/admin/custom/${id}`);
  return { ok: true };
}
