import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusTag } from '@/components/Status';
import { requireViewer } from '@/lib/auth';
import { formatDate, naira, ORDER_STATUS_LABEL } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/lib/types';

export const metadata: Metadata = { title: 'Orders', robots: { index: false } };

export default async function OrdersPage() {
  const v = await requireViewer('/account/orders');
  const { data } = await createClient()
    .from('orders')
    .select('id, number, status, total, created_at, items:order_items(qty)')
    .eq('user_id', v.id)
    .neq('status', 'expired')
    .order('created_at', { ascending: false });
  const orders = data ?? [];
  if (!orders.length)
    return (
      <div className="flex flex-col items-start gap-5">
        <p className="text-muted">No orders yet.</p>
        <Link href="/shop" className="btn-primary">
          Shop New In
        </Link>
      </div>
    );
  return (
    <ul className="border-t border-line">
      {orders.map((o) => {
        const count = (o.items as { qty: number }[]).reduce((a, i) => a + i.qty, 0);
        return (
          <li key={o.id}>
            <Link
              href={`/account/orders/${o.id}`}
              className="grid grid-cols-2 items-center gap-x-6 gap-y-2 border-b border-line py-5 text-[15px] text-ink hover:text-ink hover:no-underline md:grid-cols-4"
            >
              <span className="font-mono text-[13px] font-medium tracking-[0.08em]">{o.number}</span>
              <span className="text-muted">
                {formatDate(o.created_at)} · {count} {count === 1 ? 'item' : 'items'}
              </span>
              <span className="font-semibold">{naira(o.total)}</span>
              <StatusTag status={o.status} label={ORDER_STATUS_LABEL[o.status as OrderStatus]} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
