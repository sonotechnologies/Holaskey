'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getViewer } from '@/lib/auth';
import { getCart } from '@/lib/cart';
import { SITE_URL } from '@/lib/env';
import { normalisePhone } from '@/lib/format';
import { initializeTransaction, newReference } from '@/lib/paystack';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types';

const AddressSchema = z.object({
  recipient: z.string().trim().min(2, 'Add the full name for delivery.'),
  phone: z.string().trim().min(7, 'Add a phone number.'),
  state: z.string().trim().min(2, 'Choose a state.'),
  city: z.string().trim().min(2, 'Add a city.'),
  street: z.string().trim().min(4, 'Add a street address.'),
  landmark: z.string().trim().optional().default(''),
});

export async function startCheckout(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) redirect('/login?next=/checkout');
  if (!viewer.emailVerified) return { ok: false, error: 'Verify your email address before your first payment. Check your inbox for the link.' };
  if (!process.env.PAYSTACK_SECRET_KEY) return { ok: false, error: 'Payments are not set up yet. Add the Paystack keys to the environment.' };

  const supabase = createClient();

  // Address: a saved one, or a new one (optionally saved to the profile).
  let address: z.infer<typeof AddressSchema>;
  const addressId = String(form.get('address_id') || '');
  if (addressId && addressId !== 'new') {
    const { data } = await supabase.from('addresses').select('*').eq('id', addressId).eq('user_id', viewer.id).maybeSingle();
    if (!data) return { ok: false, error: 'Choose a delivery address.' };
    address = { recipient: data.recipient, phone: data.phone, state: data.state, city: data.city, street: data.street, landmark: data.landmark };
  } else {
    const parsed = AddressSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    const phone = normalisePhone(parsed.data.phone);
    if (!phone) return { ok: false, error: 'Enter a Nigerian phone number, e.g. 0803 555 0142.' };
    address = { ...parsed.data, phone };
    if (form.get('save_address') === 'on') {
      const { count } = await supabase.from('addresses').select('id', { count: 'exact', head: true }).eq('user_id', viewer.id);
      await supabase.from('addresses').insert({ user_id: viewer.id, label: 'Home', ...address, is_default: !count });
    }
  }

  // Server recomputes everything from the database.
  const cart = await getCart(viewer.id);
  if (!cart.lines.length) return { ok: false, error: 'Your bag is empty.' };
  if (cart.problems.length) {
    const p = cart.problems[0];
    return { ok: false, error: p.stock < 1 || !p.active ? `${p.title} (${p.size}) is sold out. Remove it to continue.` : `Only ${p.stock} of ${p.title} (${p.size}) left. Lower the quantity to continue.` };
  }

  const db = createServiceClient();
  const reference = newReference('HLK');
  const { data: order, error } = await db
    .from('orders')
    .insert({
      user_id: viewer.id,
      status: 'pending_payment',
      subtotal: cart.subtotal,
      delivery_fee: cart.deliveryFee,
      total: cart.total,
      address,
      email: viewer.email,
      paystack_ref: reference,
    })
    .select('id, number')
    .single();
  if (error || !order) return { ok: false, error: 'Could not create your order. Try again.' };

  const { error: itemsErr } = await db.from('order_items').insert(
    cart.lines.map((l) => ({
      order_id: order.id,
      variant_id: l.variantId,
      product_id: l.productId,
      title: l.title,
      size: l.size,
      colour: l.colour,
      image_path: l.image,
      unit_price: l.unitPrice,
      qty: l.qty,
    })),
  );
  if (itemsErr) {
    await db.from('orders').delete().eq('id', order.id);
    return { ok: false, error: 'Could not create your order. Try again.' };
  }

  let url: string;
  try {
    url = await initializeTransaction({
      email: viewer.email,
      amount: cart.total,
      reference,
      callbackUrl: `${SITE_URL}/checkout/success?reference=${reference}`,
      metadata: { kind: 'order', order_id: order.id, order_number: order.number, user_id: viewer.id },
    });
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'Paystack could not start the payment. Try again.' };
  }
  redirect(url);
}
