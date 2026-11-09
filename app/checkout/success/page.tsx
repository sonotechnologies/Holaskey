import type { Metadata } from 'next';
import Link from 'next/link';
import { Img } from '@/components/Img';
import { Signature } from '@/components/Signature';
import { requireViewer } from '@/lib/auth';
import { naira } from '@/lib/format';
import { productImageUrl } from '@/lib/images';
import { processChargeSuccess } from '@/lib/payments';
import { createClient } from '@/lib/supabase/server';
import { AutoRefresh } from './AutoRefresh';

export const metadata: Metadata = { title: 'Order confirmation', robots: { index: false } };

export default async function SuccessPage({ searchParams }: { searchParams: { reference?: string; trxref?: string } }) {
  const viewer = await requireViewer('/account/orders');
  const ref = searchParams.reference || searchParams.trxref || '';
  const supabase = createClient();
  const load = () =>
    supabase
      .from('orders')
      .select('id, number, status, total, address, items:order_items(id, title, size, colour, qty, unit_price, image_path)')
      .eq('paystack_ref', ref)
      .eq('user_id', viewer.id)
      .maybeSingle();

  let { data: order } = await load();

  // If the webhook hasn't landed yet, verify with Paystack directly (same idempotent path).
  if (order?.status === 'pending_payment') {
    try {
      await processChargeSuccess(ref);
      ({ data: order } = await load());
    } catch {
      /* the webhook will retry */
    }
  }

  if (!order) {
    return (
      <main className="wrap py-24">
        <h1 className="h1">Order not found</h1>
        <p className="mt-4">
          We couldn&apos;t find that payment. <Link href="/account/orders" className="link">See your orders</Link>.
        </p>
      </main>
    );
  }

  const confirmed = order.status !== 'pending_payment' && order.status !== 'expired';
  const a = order.address as { recipient: string; street: string; city: string; state: string };

  return (
    <main className="px-4 py-16 lg:py-28 animate-rise">
      <div className="mx-auto flex max-w-[680px] flex-col gap-6">
        <p className="label text-muted">Order {order.number}</p>
        {confirmed ? (
          <>
            <h1 className="display !leading-[.92]">Order confirmed.</h1>
            <p className="text-lg">
              Thanks{viewer.fullName ? `, ${viewer.fullName.split(' ')[0]}` : ''}. We&apos;ll message you on WhatsApp when it ships.
            </p>
            {order.status === 'paid_out_of_stock' && (
              <p className="border-t-2 border-accent bg-espresso p-4 text-[15px]">
                One item sold out just before your payment landed. We&apos;ll contact you within 24 hours to swap it or refund you in full.
              </p>
            )}
          </>
        ) : (
          <>
            <h1 className="display !leading-[.92]">Confirming payment…</h1>
            <p className="text-lg">This usually takes a few seconds. This page will update by itself.</p>
            <AutoRefresh />
          </>
        )}
        <div className="border-t border-line">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(order.items as any[]).map((l) => (
            <div key={l.id} className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 border-b border-line py-3.5">
              <div className="relative aspect-[4/5] bg-smoke">{l.image_path && <Img src={productImageUrl(l.image_path)!} alt="" fill sizes="56px" className="object-cover" />}</div>
              <div className="flex flex-col leading-snug">
                <span className="font-medium">{l.title}</span>
                <span className="text-sm text-muted">
                  Size {l.size} · {l.colour} · ×{l.qty}
                </span>
              </div>
              <span className="font-semibold">{naira(l.unit_price * l.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between py-3.5">
            <span className="label">{confirmed ? 'Total paid' : 'Total'}</span>
            <span className="text-xl font-semibold">{naira(order.total)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 text-[15px]">
          <span className="label text-muted">Delivering to</span>
          <span>
            {a.recipient}, {a.street}, {a.city}, {a.state}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/account/orders/${order.id}`} className="btn-primary">
            Track order
          </Link>
          <Link href="/shop" className="btn-secondary">
            Keep shopping
          </Link>
        </div>
        {confirmed && <Signature className="mt-6" />}
      </div>
    </main>
  );
}
