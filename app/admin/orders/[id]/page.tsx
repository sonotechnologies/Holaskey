import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusTag } from '@/components/Status';
import { displayPhone, formatDate, formatDateTime, naira, ORDER_STATUS_LABEL } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/lib/types';
import { OrderControls } from '../../AdminBits';

export const metadata = { title: 'Order' };

export default async function AdminOrder({ params }: { params: { id: string } }) {
  const db = createClient();
  const { data: o } = await db.from('orders').select('*, items:order_items(*)').eq('id', params.id).maybeSingle();
  if (!o) notFound();
  const { data: events } = await db.from('status_events').select('to_status, note, created_at').eq('entity', 'order').eq('entity_id', o.id).order('created_at', { ascending: false });
  const a = o.address as { recipient: string; phone: string; street: string; city: string; state: string; landmark?: string };
  const status = o.status as OrderStatus;
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/admin/orders" className="label text-muted">
          ← All orders
        </Link>
        <div className="flex flex-wrap items-baseline gap-4">
          <h1 className="font-mono text-2xl font-medium tracking-[0.06em]">{o.number}</h1>
          <StatusTag status={status} label={ORDER_STATUS_LABEL[status]} />
          {o.refunded_at && <span className="label text-muted">Refunded {formatDate(o.refunded_at)}</span>}
        </div>
        <p className="text-sm text-muted">
          Placed {formatDateTime(o.created_at)}
          {o.paid_at ? ` · paid ${formatDateTime(o.paid_at)}` : ''} · Paystack ref <span className="font-mono">{o.paystack_ref}</span>
        </p>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <div className="border-t border-line">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(o.items as any[]).map((l) => (
              <div key={l.id} className="flex justify-between gap-4 border-b border-line py-3 text-[15px]">
                <span>
                  <span className="font-medium">{l.title}</span>
                  <span className="block text-sm text-muted">
                    {l.size} · {l.colour} · ×{l.qty} @ {naira(l.unit_price)}
                  </span>
                </span>
                <span className="font-semibold">{naira(l.unit_price * l.qty)}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 text-[15px]">
              <span>Subtotal</span>
              <span>{naira(o.subtotal)}</span>
            </div>
            <div className="flex justify-between py-2 text-[15px]">
              <span>Delivery</span>
              <span>{naira(o.delivery_fee)}</span>
            </div>
            <div className="flex justify-between border-t border-line py-3">
              <span className="label">Total</span>
              <span className="font-semibold">{naira(o.total)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 text-[15px]">
            <span className="label text-muted">Deliver to</span>
            <span>{a.recipient}</span>
            <span>
              {a.street}
              {a.landmark ? ` (${a.landmark})` : ''}, {a.city}, {a.state}
            </span>
            <a href={`tel:${a.phone}`}>{displayPhone(a.phone)}</a>
            <span className="text-muted">{o.email}</span>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <OrderControls id={o.id} status={status} tracking={o.tracking_note} refunded={!!o.refunded_at} />
          {!!events?.length && (
            <ul className="flex flex-col gap-2 text-[15px]">
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
          )}
        </div>
      </div>
    </div>
  );
}
