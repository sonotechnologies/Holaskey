'use server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getViewer } from '@/lib/auth';
import { emails } from '@/lib/email';
import { CUSTOM_STATUS_LABEL, formatDate, parseNaira, slugify } from '@/lib/format';
import { userEmail } from '@/lib/payments';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { ActionResult, CustomStatus, OrderStatus } from '@/lib/types';

/** Every admin action re-checks the role server-side; writes then go through RLS as the admin. */
async function admin() {
  const v = await getViewer();
  if (!v || v.role !== 'admin') redirect('/login?next=/admin');
  return { v, db: createClient() };
}

async function event(entity: 'order' | 'custom', id: string, from: string | null, to: string, note: string | null, actor: string) {
  await createClient().from('status_events').insert({ entity, entity_id: id, from_status: from, to_status: to, note: note || null, actor_id: actor });
}

// ---------------------------------------------------------------------------
// Custom requests
// ---------------------------------------------------------------------------

export async function sendQuote(id: string, input: { price: string; delivery: string; days: string; valid: string; note: string }): Promise<ActionResult> {
  const { v, db } = await admin();
  const amount = parseNaira(input.price);
  if (!amount) return { ok: false, error: 'Enter a price.' };
  const delivery = parseNaira(input.delivery) ?? 0;
  const days = Math.max(1, Math.round(Number(input.days) || 0)) || null;
  const valid = Math.min(60, Math.max(1, Math.round(Number(input.valid) || 7)));
  const { data: r } = await db.from('custom_requests').select('id, number, user_id, status').eq('id', id).single();
  if (!r) return { ok: false, error: 'Request not found.' };
  if (!['submitted', 'needs_info', 'quoted', 'expired', 'declined'].includes(r.status)) return { ok: false, error: 'This request is already paid.' };
  const expires = new Date(Date.now() + valid * 86400000);
  const { error } = await db
    .from('custom_requests')
    .update({
      status: 'quoted',
      quote_amount: amount,
      quote_delivery: delivery,
      quote_days: days,
      quote_note: input.note.trim() || null,
      quote_expires_at: expires.toISOString(),
      quote_reminder_sent: false,
      paystack_ref: null,
    })
    .eq('id', id);
  if (error) return { ok: false, error: 'Could not save the quote.' };
  await event('custom', id, r.status, 'quoted', null, v.id);
  const to = await userEmail(r.user_id);
  if (to) await emails.quoteReady(to, { number: r.number, id, total: amount + delivery, days, expires: formatDate(expires.toISOString()) });
  revalidatePath(`/admin/custom/${id}`);
  return { ok: true, message: 'Quote sent to the customer.' };
}

export async function askQuestion(id: string, question: string): Promise<ActionResult> {
  const { v, db } = await admin();
  const text = question.trim();
  if (!text) return { ok: false, error: 'Write your question.' };
  const { data: r } = await db.from('custom_requests').select('id, number, user_id, status').eq('id', id).single();
  if (!r) return { ok: false, error: 'Request not found.' };
  await db.from('custom_messages').insert({ request_id: id, sender_id: v.id, from_admin: true, body: text });
  if (r.status !== 'needs_info') {
    await db.from('custom_requests').update({ status: 'needs_info' }).eq('id', id);
    await event('custom', id, r.status, 'needs_info', null, v.id);
  }
  const to = await userEmail(r.user_id);
  if (to) await emails.needsInfo(to, { number: r.number, id, question: text });
  revalidatePath(`/admin/custom/${id}`);
  return { ok: true, message: 'Question sent.' };
}

const PRODUCTION: Partial<Record<CustomStatus, CustomStatus[]>> = {
  paid: ['in_production'],
  in_production: ['ready', 'shipped'],
  ready: ['shipped'],
  shipped: ['delivered'],
};

export async function setCustomStatus(id: string, to: CustomStatus, note: string): Promise<ActionResult> {
  const { v, db } = await admin();
  const { data: r } = await db.from('custom_requests').select('id, number, user_id, status').eq('id', id).single();
  if (!r) return { ok: false, error: 'Request not found.' };
  if (!PRODUCTION[r.status as CustomStatus]?.includes(to)) return { ok: false, error: `Can't move from ${r.status} to ${to}.` };
  await db.from('custom_requests').update({ status: to }).eq('id', id);
  await event('custom', id, r.status, to, note, v.id);
  const email = await userEmail(r.user_id);
  if (email) await emails.customStatus(email, { number: r.number, id, label: CUSTOM_STATUS_LABEL[to], note });
  revalidatePath(`/admin/custom/${id}`);
  return { ok: true, message: `Marked ${CUSTOM_STATUS_LABEL[to].toLowerCase()}.` };
}

export async function cancelCustom(id: string, reason: string): Promise<ActionResult> {
  const { v, db } = await admin();
  const { data: r } = await db.from('custom_requests').select('id, number, user_id, status').eq('id', id).single();
  if (!r) return { ok: false, error: 'Request not found.' };
  if (['paid', 'in_production', 'ready', 'shipped', 'delivered'].includes(r.status)) return { ok: false, error: 'Paid requests cannot be cancelled here.' };
  await db.from('custom_requests').update({ status: 'cancelled', cancel_reason: reason.trim() }).eq('id', id);
  await event('custom', id, r.status, 'cancelled', reason, v.id);
  const email = await userEmail(r.user_id);
  if (email) await emails.customStatus(email, { number: r.number, id, label: 'Cancelled', note: reason });
  revalidatePath(`/admin/custom/${id}`);
  return { ok: true, message: 'Request cancelled.' };
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

const ORDER_NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  paid: ['processing', 'shipped'],
  processing: ['shipped'],
  shipped: ['delivered'],
  paid_out_of_stock: ['processing', 'cancelled'],
};

export async function setOrderStatus(id: string, to: OrderStatus, note: string): Promise<ActionResult> {
  const { v, db } = await admin();
  const { data: o } = await db.from('orders').select('id, number, status, email').eq('id', id).single();
  if (!o) return { ok: false, error: 'Order not found.' };
  if (!ORDER_NEXT[o.status as OrderStatus]?.includes(to)) return { ok: false, error: `Can't move from ${o.status} to ${to}.` };
  const patch: Record<string, unknown> = { status: to };
  if (to === 'shipped' && note.trim()) patch.tracking_note = note.trim();
  await db.from('orders').update(patch).eq('id', id);
  await event('order', id, o.status, to, note, v.id);
  if (o.email && (to === 'processing' || to === 'shipped' || to === 'delivered')) await emails.orderStatus(o.email, { number: o.number, id, status: to, note });
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, message: 'Status updated.' };
}

export async function setTrackingNote(id: string, note: string): Promise<ActionResult> {
  const { db } = await admin();
  await db.from('orders').update({ tracking_note: note.trim() || null }).eq('id', id);
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, message: 'Tracking note saved.' };
}

export async function markRefunded(id: string): Promise<ActionResult> {
  const { v, db } = await admin();
  const { data: o } = await db.from('orders').select('status').eq('id', id).single();
  await db.from('orders').update({ refunded_at: new Date().toISOString() }).eq('id', id);
  await event('order', id, o?.status ?? null, o?.status ?? 'paid', 'Refund given', v.id);
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, message: 'Marked as refunded.' };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const ProductSchema = z.object({
  title: z.string().trim().min(2, 'Add a title.'),
  slug: z.string().trim().optional(),
  category_id: z.string().uuid('Choose a category.'),
  price: z.string().min(1, 'Add a price.'),
  compare_at_price: z.string().optional(),
  description: z.string().trim().default(''),
  care: z.string().trim().default(''),
});

type Img = { path: string; alt: string };
type Var = { id?: string; size: string; colour: string; colour_hex?: string | null; stock: number; sku?: string | null };

export async function saveProduct(
  id: string | null,
  fields: Record<string, string>,
  flags: { is_new: boolean; is_featured: boolean; archived: boolean },
  images: Img[],
  variants: Var[],
): Promise<ActionResult & { id?: string }> {
  const { db } = await admin();
  const parsed = ProductSchema.safeParse(fields);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const price = parseNaira(parsed.data.price);
  if (!price) return { ok: false, error: 'Add a price.' };
  if (images.length > 8) return { ok: false, error: 'Up to 8 images per product.' };
  const missingAlt = images.findIndex((i) => !i.alt.trim());
  if (missingAlt >= 0) return { ok: false, error: `Add alt text for image ${missingAlt + 1} (describe what it shows).` };
  const clean = variants.filter((v) => v.size.trim() && v.colour.trim());
  const keys = new Set(clean.map((v) => `${v.size.trim()}|${v.colour.trim()}`.toLowerCase()));
  if (keys.size !== clean.length) return { ok: false, error: 'Each size and colour combination can only appear once.' };

  const row = {
    title: parsed.data.title,
    slug: slugify(parsed.data.slug || parsed.data.title),
    category_id: parsed.data.category_id,
    price,
    compare_at_price: parseNaira(parsed.data.compare_at_price ?? ''),
    description: parsed.data.description,
    care: parsed.data.care,
    is_new: flags.is_new,
    is_featured: flags.is_featured,
    status: flags.archived ? 'archived' : 'active',
  };
  let productId = id;
  if (id) {
    const { error } = await db.from('products').update(row).eq('id', id);
    if (error) return { ok: false, error: error.code === '23505' ? 'That slug is taken.' : 'Could not save.' };
  } else {
    const { data, error } = await db.from('products').insert(row).select('id').single();
    if (error || !data) return { ok: false, error: error?.code === '23505' ? 'That slug is taken.' : 'Could not save.' };
    productId = data.id;
  }

  // Images: replace the list in its new order.
  await db.from('product_images').delete().eq('product_id', productId!);
  if (images.length) await db.from('product_images').insert(images.map((im, i) => ({ product_id: productId, path: im.path, alt: im.alt.trim(), sort: i })));

  // Variants: update existing, insert new, delete removed ones not referenced by carts.
  const { data: existing } = await db.from('product_variants').select('id').eq('product_id', productId!);
  const keep = new Set(clean.filter((v) => v.id).map((v) => v.id!));
  const removed = (existing ?? []).map((e) => e.id).filter((x) => !keep.has(x));
  if (removed.length) await db.from('product_variants').delete().in('id', removed);
  for (const v of clean) {
    const vr = { product_id: productId, size: v.size.trim(), colour: v.colour.trim(), colour_hex: v.colour_hex || null, stock: Math.max(0, Math.round(v.stock || 0)), sku: v.sku?.trim() || null };
    if (v.id) await db.from('product_variants').update(vr).eq('id', v.id);
    else await db.from('product_variants').insert(vr);
  }
  revalidateTag('catalog');
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Saved.', id: productId! };
}

// ---------------------------------------------------------------------------
// Categories & settings
// ---------------------------------------------------------------------------

export async function saveCategory(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const { db } = await admin();
  const name = String(form.get('name') || '').trim();
  const type = form.get('type') === 'shoes' ? 'shoes' : 'clothing';
  const id = String(form.get('id') || '');
  const sort = Number(form.get('sort') || 0) || 0;
  const image_path = String(form.get('image_path') || '').trim() || null;
  if (!name) return { ok: false, error: 'Add a name.' };
  const row = { name, type, sort, slug: slugify(String(form.get('slug') || '') || name), image_path };
  const { error } = id ? await db.from('categories').update(row).eq('id', id) : await db.from('categories').insert(row);
  if (error) return { ok: false, error: error.code === '23505' ? 'That slug is taken.' : 'Could not save.' };
  revalidateTag('catalog');
  revalidatePath('/admin/categories');
  return { ok: true, message: 'Saved.' };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const { db } = await admin();
  const { count } = await db.from('products').select('id', { count: 'exact', head: true }).eq('category_id', id);
  if (count) return { ok: false, error: `Move its ${count} products to another category first.` };
  await db.from('categories').delete().eq('id', id);
  revalidateTag('catalog');
  revalidatePath('/admin/categories');
  return { ok: true };
}

export async function saveSettings(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const { db } = await admin();
  const fee = parseNaira(String(form.get('delivery_fee') || ''));
  if (fee === null) return { ok: false, error: 'Enter the delivery fee.' };
  const hero = String(form.get('hero_images') || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const { error } = await db
    .from('settings')
    .update({
      delivery_fee: fee,
      quote_expiry_days: Math.min(60, Math.max(1, Number(form.get('quote_expiry_days')) || 7)),
      whatsapp: String(form.get('whatsapp') || '').trim(),
      instagram: String(form.get('instagram') || '').trim(),
      announcement: String(form.get('announcement') || '').trim(),
      hero_images: hero,
    })
    .eq('singleton', true);
  if (error) return { ok: false, error: 'Could not save settings.' };
  revalidateTag('catalog');
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Settings saved.' };
}

/** Housekeeping the owner can run by hand (also runs daily via cron). */
export async function runExpiry(): Promise<ActionResult> {
  await admin();
  await createServiceClient().rpc('expire_stale');
  revalidatePath('/admin');
  return { ok: true, message: 'Expired stale orders and quotes.' };
}
