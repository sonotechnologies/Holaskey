import type { Metadata } from 'next';
import Link from 'next/link';
import { Img, PhotoPlaceholder } from '@/components/Img';
import { RecentlyViewed } from '@/components/RecentlyViewed';
import { requireViewer } from '@/lib/auth';
import { getCart } from '@/lib/cart';
import { naira } from '@/lib/format';
import { productImageUrl } from '@/lib/images';
import { QtyControl } from './CartClient';

export const metadata: Metadata = { title: 'Bag', robots: { index: false } };

export default async function CartPage() {
  const viewer = await requireViewer('/cart');
  const cart = await getCart(viewer.id);

  return (
    <main className="wrap pb-16 pt-6 lg:pb-24 lg:pt-12 animate-rise">
      <div className="mb-8 flex items-baseline gap-4">
        <h1 className="h1">Bag</h1>
        <span className="label text-muted">
          {cart.count} {cart.count === 1 ? 'item' : 'items'}
        </span>
      </div>

      {!cart.lines.length ? (
        <div className="flex flex-col items-start gap-5 border-t border-line py-12">
          <p className="text-lg">Your bag is empty.</p>
          <Link href="/shop?new=1" className="btn-primary">
            Shop New In
          </Link>
          <RecentlyViewed className="mt-10 w-full" />
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-8 lg:gap-16">
          <ul className="min-w-0 flex-[2_1_560px] border-t border-line">
            {cart.lines.map((l) => {
              const img = productImageUrl(l.image);
              const problem = !l.active || l.stock < l.qty;
              return (
                <li key={l.id} className="grid grid-cols-[88px_minmax(0,1fr)_auto] gap-3 border-b border-line py-5 lg:grid-cols-[120px_minmax(0,1fr)_auto] lg:gap-6">
                  <Link href={`/product/${l.slug}`} className="relative aspect-[4/5] bg-smoke" aria-label={l.title}>
                    {img ? <Img src={img} alt={l.imageAlt} fill sizes="120px" className="object-cover" /> : <PhotoPlaceholder label="Photo" />}
                  </Link>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="label-sm text-muted">{l.category}</span>
                    <Link href={`/product/${l.slug}`} className="font-medium">
                      {l.title}
                    </Link>
                    <span className="text-sm text-muted">
                      Size {l.size} · {l.colour}
                    </span>
                    {problem && (
                      <p role="alert" className="text-sm">
                        <span className="label text-err">Error</span>{' '}
                        {l.stock < 1 || !l.active ? 'Sold out. Remove it to check out.' : `Only ${l.stock} left. Lower the quantity.`}
                      </p>
                    )}
                    <div className="mt-auto pt-2">
                      <QtyControl id={l.id} qty={l.qty} max={l.stock} title={l.title} />
                    </div>
                  </div>
                  <span className="font-semibold">{naira(l.unitPrice * l.qty)}</span>
                </li>
              );
            })}
          </ul>
          <aside className="flex flex-[1_1_300px] flex-col gap-3.5 bg-espresso p-7 lg:sticky lg:top-24">
            <h2 className="label">Summary</h2>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">{naira(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>
                Delivery <span className="text-muted">(flat, anywhere in Nigeria)</span>
              </span>
              <span className="font-semibold">{naira(cart.deliveryFee)}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-3.5">
              <span className="label">Total</span>
              <span className="text-[22px] font-semibold">{naira(cart.total)}</span>
            </div>
            {cart.problems.length ? (
              <span className="btn-primary pointer-events-none mt-2 opacity-50" aria-disabled>
                Checkout
              </span>
            ) : (
              <Link href="/checkout" className="btn-primary mt-2">
                Checkout
              </Link>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
