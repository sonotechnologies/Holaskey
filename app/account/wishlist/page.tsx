import type { Metadata } from 'next';
import { ProductCard } from '@/components/ProductCard';
import { getWishIds, toCard } from '@/lib/cards';
import { getProducts } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Wishlist', robots: { index: false } };

export default async function WishlistPage() {
  const [all, wish] = await Promise.all([getProducts(), getWishIds()]);
  const items = all.filter((p) => wish.has(p.id));
  if (!items.length) return <p className="text-muted">Nothing saved yet. Tap the heart on any piece to keep it here.</p>;
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 lg:gap-6">
      {items.map((p) => (
        <ProductCard key={p.id} p={toCard(p, wish)} />
      ))}
    </div>
  );
}
