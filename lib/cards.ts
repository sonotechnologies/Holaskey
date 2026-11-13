import 'server-only';
import { cache } from 'react';
import type { CardProduct } from '@/components/ProductCard';
import { getViewer } from './auth';
import { isSoldOut } from './catalog';
import { createClient } from './supabase/server';
import type { Product } from './types';

export const getWishIds = cache(async (): Promise<Set<string>> => {
  const v = await getViewer();
  if (!v) return new Set();
  const { data } = await createClient().from('wishlist').select('product_id').eq('user_id', v.id);
  return new Set((data ?? []).map((r) => r.product_id as string));
});

export const getCartCount = cache(async (): Promise<number> => {
  const v = await getViewer();
  if (!v) return 0;
  const { data } = await createClient().from('cart_items').select('qty').eq('user_id', v.id);
  return (data ?? []).reduce((a, r) => a + (r.qty as number), 0);
});

export function toCard(p: Product, wish: Set<string>): CardProduct {
  const [a, b] = p.images;
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: p.price,
    category: p.category?.name ?? '',
    isNew: p.is_new,
    soldOut: isSoldOut(p),
    img: a?.path ?? null,
    img2: b?.path ?? null,
    alt: a?.alt || p.title,
    alt2: b?.alt || p.title,
    wished: wish.has(p.id),
    colours: Array.from(new Map(p.variants.map((v) => [v.colour, v.colour_hex])), ([name, hex]) => ({ name, hex })),
    low: !isSoldOut(p) && p.variants.reduce((a, v) => a + v.stock, 0) <= 3,
  };
}
