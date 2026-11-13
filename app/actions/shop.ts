'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getViewer, safeNext } from '@/lib/auth';
import { getCart } from '@/lib/cart';
import { hasSupabase, NOT_CONFIGURED } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types';

function loginRedirect(next: string): never {
  redirect(`/login?next=${encodeURIComponent(safeNext(next, '/shop'))}`);
}

export type AddResult = (ActionResult & { bag?: { count: number; subtotal: number } }) | null;

export async function addToCart(_prev: AddResult, form: FormData): Promise<AddResult> {
  const next = String(form.get('next') || '/shop');
  if (!hasSupabase) return { ok: false, error: NOT_CONFIGURED };
  const viewer = await getViewer();
  if (!viewer) loginRedirect(next);

  const variantId = String(form.get('variant_id') || '');
  if (!variantId) return { ok: false, error: 'Choose a size to add this to your bag.' };

  const supabase = createClient();
  const { data: variant } = await supabase.from('product_variants').select('id, stock').eq('id', variantId).maybeSingle();
  if (!variant) return { ok: false, error: 'That size is no longer available.' };
  if (variant.stock < 1) return { ok: false, error: 'That size is sold out.' };

  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, qty')
    .eq('user_id', viewer.id)
    .eq('variant_id', variantId)
    .maybeSingle();
  const qty = (existing?.qty ?? 0) + 1;
  if (qty > variant.stock) return { ok: false, error: `Only ${variant.stock} left in that size, and they're already in your bag.` };

  const { error } = existing
    ? await supabase.from('cart_items').update({ qty }).eq('id', existing.id)
    : await supabase.from('cart_items').insert({ user_id: viewer.id, variant_id: variantId, qty });
  if (error) return { ok: false, error: 'Could not add to your bag. Try again.' };
  revalidatePath('/', 'layout');
  const bag = await getCart(viewer.id);
  return { ok: true, message: 'Added to bag', bag: { count: bag.count, subtotal: bag.subtotal } };
}

export async function setCartQty(itemId: string, qty: number): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) loginRedirect('/cart');
  const supabase = createClient();
  const { data: item } = await supabase
    .from('cart_items')
    .select('id, variant:product_variants(stock)')
    .eq('id', itemId)
    .maybeSingle();
  if (!item) return { ok: false, error: 'Item not found.' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stock = (item.variant as any)?.stock ?? 0;
  const clamped = Math.max(1, Math.min(qty, stock));
  await supabase.from('cart_items').update({ qty: clamped }).eq('id', itemId);
  revalidatePath('/', 'layout');
  return clamped < qty ? { ok: false, error: `Only ${stock} left in that size.` } : { ok: true };
}

export async function removeCartItem(itemId: string): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) loginRedirect('/cart');
  await createClient().from('cart_items').delete().eq('id', itemId);
  revalidatePath('/', 'layout');
}

export async function toggleWishlist(productId: string, next: string): Promise<{ wished: boolean } | { error: string }> {
  if (!hasSupabase) return { error: NOT_CONFIGURED };
  const viewer = await getViewer();
  if (!viewer) loginRedirect(next);
  const supabase = createClient();
  const { data: existing } = await supabase
    .from('wishlist')
    .select('id')
    .eq('user_id', viewer.id)
    .eq('product_id', productId)
    .maybeSingle();
  if (existing) {
    await supabase.from('wishlist').delete().eq('id', existing.id);
  } else {
    await supabase.from('wishlist').insert({ user_id: viewer.id, product_id: productId });
  }
  revalidatePath('/account/wishlist');
  return { wished: !existing };
}
