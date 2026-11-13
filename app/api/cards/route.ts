import { NextResponse } from 'next/server';
import { getWishIds, toCard } from '@/lib/cards';
import { getProducts } from '@/lib/catalog';

/** Product cards by slug, in the order asked (used by "Recently viewed"). */
export async function GET(req: Request) {
  const slugs = (new URL(req.url).searchParams.get('slugs') ?? '').split(',').filter(Boolean).slice(0, 12);
  if (!slugs.length) return NextResponse.json([]);
  const [all, wish] = await Promise.all([getProducts(), getWishIds()]);
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  const cards = slugs.map((s) => bySlug.get(s)).filter(Boolean).map((p) => toCard(p!, wish));
  return NextResponse.json(cards, { headers: { 'Cache-Control': 'private, max-age=60' } });
}
