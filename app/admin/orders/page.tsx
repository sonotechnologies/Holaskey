import Link from 'next/link';
import { StatusTag } from '@/components/Status';
import { formatDate, naira, ORDER_STATUS_LABEL } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/lib/types';
import { StatusFilter } from '../StatusFilter';

export const metadata = { title: 'Orders' };

const FILTERS: [string, string][] = [
  ['', 'All paid'],
  ['paid', 'To pack'],
  ['processing', 'Processing'],
  ['shipped', 'Shipped'],
  ['delivered', 'Delivered'],
  ['paid_out_of_stock', 'Out of stock'],
  ['pending_payment', 'Unpaid'],
  ['expired', 'Expired'],
  ['cancelled', 'Cancelled'],
];

export default async function AdminOrders({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status ?? '';
  let q = createClient().from('orders').select('id, number, status, total, created_at, address, refunded_at').order('created_at', { ascending: false }).limit(200);
  q = status ? q.eq('status', status) : q.in('status', ['paid', 'paid_out_of_stock', 'processing', 'shipped', 'delivered']);
  const { data } = await q;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="h1">Orders</h1>
      <StatusFilter base="/admin/orders" current={status} options={FILTERS} />
      <ul className="border-t border-line">
        {!data?.length && <li className="py-4 text-muted">No orders.</li>}
        {(data ?? []).map((o) => (
          <li key={o.id}>
            <Link href={`/admin/orders/${o.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 border-b border-line py-4 text-[15px] text-ink hover:text-ink hover:no-underline md:grid-cols-5 md:items-center">
              <span className="font-mono text-[13px] font-medium">{o.number}</span>
              <span className="text-right font-semibold md:order-last">{naira(o.total)}</span>
              <span className="truncate text-muted">{(o.address as { recipient?: string })?.recipient}</span>
              <span className="text-right text-sm text-muted md:text-left">{formatDate(o.created_at)}</span>
              <span className="col-span-2 md:col-span-1">
                <StatusTag status={o.status} label={ORDER_STATUS_LABEL[o.status as OrderStatus] + (o.refunded_at ? ' · refunded' : '')} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
