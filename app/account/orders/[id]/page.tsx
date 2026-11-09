import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Img } from '@/components/Img';
import { StatusTag, Tracker } from '@/components/Status';
import { requireViewer } from '@/lib/auth';
import { formatDate, formatDateTime, naira, ORDER_STATUS_LABEL, orderTrackIndex } from '@/lib/format';
import { productImageUrl } from '@/lib/images';
import { createClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/lib/types';

export const metadata: Metadata = { title: 'Order', robots: { index: false } };

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const v = await requireViewer(`/account/orders/${params.id}`);
  const supabase = createClient();
  const { data: o } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', params.id)
    .eq('user_id', v.id)
    .maybeSingle();
  if (!o) notFound();
  const { data: events } = await supabase
    .from('status_events')
    .select('to_status, note, created_at')
    .eq('entity', 'order')
    .eq('entity_id', o.id)
    .order('created_at', { ascending: false });
  const status = o.status as OrderStatus;
  const idx = orderTrackIndex(status);
  const a = o.address as { recipient: string; phone: string; street: string; city: string; state: string; landmark?: string };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/account/orders" className="label text-muted">
          ← All orders
        </Link>
        <div className="flex flex-wrap items-baseline gap-4">
          <h2 className="font-mono text-[clamp(20px,1.65vw,24px)] font-medium tracking-[0.06em]">{o.number}</h2>
          <StatusTag status={status} label={ORDER_STATUS_LABEL[status]} />
        </div>
        <p className="text-[15px] text-muted">
          Placed {formatDate(o.created_at)} · {naira(o.total)}
        </p>
      </div>
      {idx >= 0 && <Tracker labels={['Paid', 'Packed', 'Shipped', 'Delivered']} current={idx} />}
      {status === 'pending_payment' && <p className="text-[15px]">We haven&apos;t received payment for this order yet. Unpaid orders close after 24 hours.</p>}
      {status === 'paid_out_of_stock' && (
        <p className="border-t-2 border-accent bg-espresso p-4 text-[15px]">An item sold out just before your payment landed. We&apos;ll contact you to swap it or refund you in full.</p>
      )}
      {o.tracking_note && (
        <div className="flex flex-col gap-1 text-[15px]">
          <span className="label text-muted">Tracking</span>
          <span>{o.tracking_note}</span>
        </div>
      )}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="border-t border-line">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(o.items as any[]).map((l) => (
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
          <div className="flex justify-between py-2 text-[15px]">
            <span>Delivery</span>
            <span>{naira(o.delivery_fee)}</span>
          </div>
          <div className="flex justify-between border-t border-line py-3">
            <span className="label">Total</span>
            <span className="font-semibold">{naira(o.total)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-6 text-[15px]">
          <div className="flex flex-col gap-1">
            <span className="label text-muted">Delivering to</span>
            <span>
              {a.recipient}, {a.street}
              {a.landmark ? ` (${a.landmark})` : ''}, {a.city}, {a.state}
            </span>
          </div>
          {!!events?.length && (
            <div className="flex flex-col gap-2">
              <span className="label text-muted">Timeline</span>
              <ul className="flex flex-col gap-2">
                {events.map((e, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="label-sm w-28 flex-none pt-0.5 text-muted">{formatDateTime(e.created_at)}</span>
                    <span>
                      {ORDER_STATUS_LABEL[e.to_status as OrderStatus] ?? e.to_status}
                      {e.note ? ` — ${e.note}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
