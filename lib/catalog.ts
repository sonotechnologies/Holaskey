import 'server-only';
import { cache } from 'react';
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from './demo';
import { hasSupabase } from './env';
import { createClient, createPublicClient } from './supabase/server';
import type { Category, Product, Settings } from './types';

const PRODUCT_SELECT =
  'id, slug, title, price, compare_at_price, description, care, is_new, is_featured, status, created_at,' +
  ' category:categories(id, type, name, slug, sort, image_path),' +
  ' images:product_images(id, path, alt, sort),' +
  ' variants:product_variants(id, size, colour, colour_hex, stock, sku)';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalise(row: any): Product {
  return {
    ...row,
    images: [...(row.images ?? [])].sort((a, b) => a.sort - b.sort),
    variants: row.variants ?? [],
  } as Product;
}

export const DEFAULT_SETTINGS: Settings = {
  delivery_fee: 500000,
  quote_expiry_days: 7,
  whatsapp: '',
  instagram: 'https://instagram.com/shopwithholaskey',
  announcement: 'Custom orders now open — send us the look',
  hero_images: [],
};

export const getSettings = cache(async (): Promise<Settings> => {
  if (!hasSupabase) return DEFAULT_SETTINGS;
  const { data } = await createPublicClient().from('settings').select('*').limit(1).maybeSingle();
  return data ? { ...DEFAULT_SETTINGS, ...data } : DEFAULT_SETTINGS;
});

export const getCategories = cache(async (): Promise<Category[]> => {
  if (!hasSupabase) return DEMO_CATEGORIES;
  const { data } = await createPublicClient().from('categories').select('*').order('sort');
  return (data as Category[]) ?? [];
});

export const getProducts = cache(async (): Promise<Product[]> => {
  if (!hasSupabase) return DEMO_PRODUCTS;
  const { data, error } = await createPublicClient()
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalise);
});

export const getProduct = cache(async (slug: string): Promise<Product | null> => {
  if (!hasSupabase) return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
  const { data } = await createPublicClient()
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  return data ? normalise(data) : null;
});

/** Admin: every product including archived (uses the session; RLS lets admins see them). */
export async function getProductsForAdmin(): Promise<Product[]> {
  const { data, error } = await createClient()
    .from('products')
    .select(PRODUCT_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalise);
}

export async function getProductByIdForAdmin(id: string): Promise<Product | null> {
  const { data } = await createClient().from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle();
  return data ? normalise(data) : null;
}

export function totalStock(p: Product) {
  return p.variants.reduce((a, v) => a + v.stock, 0);
}

export function isSoldOut(p: Product) {
  return p.variants.length > 0 && totalStock(p) === 0;
}

export interface ShopFilters {
  cats: string[];
  sizes: string[];
  colours: string[];
  price: string | null; // key of PRICE_BANDS
  sort: 'new' | 'low' | 'high';
}

export const PRICE_BANDS: { key: string; label: string; min: number; max: number }[] = [
  { key: 'u100', label: 'Under ₦100k', min: 0, max: 100000_00 },
  { key: '100-200', label: '₦100k–₦200k', min: 100000_00, max: 200000_00 },
  { key: '200-300', label: '₦200k–₦300k', min: 200000_00, max: 300000_00 },
  { key: 'o300', label: 'Over ₦300k', min: 300000_00, max: Number.MAX_SAFE_INTEGER },
];

export function filterProducts(all: Product[], f: ShopFilters, categories: Category[]): Product[] {
  // A "type" slug (clothing / shoes) selects every category of that type.
  const catSlugs = new Set<string>();
  f.cats.forEach((c) => {
    if (c === 'clothing' || c === 'shoes') categories.filter((x) => x.type === c).forEach((x) => catSlugs.add(x.slug));
    else catSlugs.add(c);
  });
  const band = PRICE_BANDS.find((b) => b.key === f.price);
  let list = all.filter(
    (p) =>
      (!catSlugs.size || (p.category && catSlugs.has(p.category.slug))) &&
      (!f.sizes.length || p.variants.some((v) => f.sizes.includes(v.size) && v.stock > 0)) &&
      (!f.colours.length || p.variants.some((v) => f.colours.includes(v.colour))) &&
      (!band || (p.price >= band.min && p.price < band.max)),
  );
  if (f.sort === 'low') list = [...list].sort((a, b) => a.price - b.price);
  else if (f.sort === 'high') list = [...list].sort((a, b) => b.price - a.price);
  else list = [...list].sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0) || b.created_at.localeCompare(a.created_at));
  return list;
}
