import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireViewer } from '@/lib/auth';
import { getCart } from '@/lib/cart';
import { naira } from '@/lib/format';
import { productImageUrl } from '@/lib/images';
import { createClient } from '@/lib/supabase/server';
import type { Address } from '@/lib/types';
import { CheckoutForm } from './CheckoutForm';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };

export default async function CheckoutPage() {
  const viewer = await requireViewer('/checkout');
  const cart = await getCart(viewer.id);
  if (!cart.lines.length) redirect('/cart');
  const { data: addresses } = await createClient()
    .from('addresses')
    .select('*')
    .eq('user_id', viewer.id)
    .order('is_default', { ascending: false })
    .order('created_at');

  return (
    <main className="wrap pb-16 pt-6 lg:pb-24 lg:pt-12 animate-rise">
      <div className="mb-8 flex flex-col gap-2">
        <Link href="/cart" className="label text-muted">
          ← Back to bag
        </Link>
        <h1 className="h1">Checkout</h1>
      </div>
      <CheckoutForm
        email={viewer.email}
        emailVerified={viewer.emailVerified}
        name={viewer.fullName}
        phone={viewer.phone}
        addresses={(addresses as Address[]) ?? []}
        summary={{
          lines: cart.lines.map((l) => ({
            id: l.id,
            title: l.title,
            meta: `Size ${l.size} · ${l.colour}`,
            qty: l.qty,
            price: naira(l.unitPrice * l.qty),
            image: productImageUrl(l.image),
          })),
          subtotal: naira(cart.subtotal),
          delivery: naira(cart.deliveryFee),
          total: naira(cart.total),
        }}
      />
    </main>
  );
}
