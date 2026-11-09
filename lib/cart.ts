import 'server-only';
import { getSettings } from './catalog';
import { createClient } from './supabase/server';

export interface CartLine {
  id: string;
  qty: number;
  variantId: string;
  size: string;
  colour: string;
  stock: number;
  productId: string;
  slug: string;
  title: string;
  category: string;
  unitPrice: number;
  image: string | null;
  imageAlt: string;
  active: boolean;
}

/** Reads the cart with live prices and stock from the database (never from the client). */
export async function getCart(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('cart_items')
    .select(
      'id, qty, variant:product_variants(id, size, colour, stock, product:products(id, slug, title, price, status, category:categories(name), images:product_images(path, alt, sort)))',
    )
    .eq('user_id', userId)
    .order('created_at');

  const lines: CartLine[] = (data ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => {
      const v = row.variant;
      const p = v?.product;
      if (!v || !p) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const img = [...(p.images ?? [])].sort((a: any, b: any) => a.sort - b.sort)[0];
      return {
        id: row.id,
        qty: row.qty,
        variantId: v.id,
        size: v.size,
        colour: v.colour,
        stock: v.stock,
        productId: p.id,
        slug: p.slug,
        title: p.title,
        category: p.category?.name ?? '',
        unitPrice: p.price,
        image: img?.path ?? null,
        imageAlt: img?.alt || p.title,
        active: p.status === 'active',
      } satisfies CartLine;
    })
    .filter(Boolean) as CartLine[];

  const settings = await getSettings();
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  const deliveryFee = lines.length ? settings.delivery_fee : 0;
  const problems = lines.filter((l) => !l.active || l.stock < l.qty);
  return { lines, count, subtotal, deliveryFee, total: subtotal + deliveryFee, problems };
}
