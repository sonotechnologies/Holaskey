import { NextResponse } from 'next/server';
import { getCategories, getProducts, isSoldOut } from '@/lib/catalog';
import { naira } from '@/lib/format';
import { productImageUrl } from '@/lib/images';
import { searchProducts } from '@/lib/search';

/** Instant search suggestions: up to 6 products and matching categories. */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get('q') ?? '').trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ products: [], categories: [], total: 0 });
  const [all, cats] = await Promise.all([getProducts(), getCategories()]);
  const hits = searchProducts(all, q);
  const ql = q.toLowerCase();
  return NextResponse.json(
    {
      total: hits.length,
      categories: cats.filter((c) => c.name.toLowerCase().includes(ql)).slice(0, 3).map((c) => ({ name: c.name, slug: c.slug })),
      products: hits.slice(0, 6).map((p) => ({
        slug: p.slug,
        title: p.title,
        category: p.category?.name ?? '',
        price: naira(p.price),
        image: productImageUrl(p.images[0]?.path),
        soldOut: isSoldOut(p),
      })),
    },
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } },
  );
}
