import Link from 'next/link';
import { StatusTag } from '@/components/Status';
import { CUSTOM_STATUS_LABEL, formatDate, naira, ORDER_STATUS_LABEL } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import type { CustomStatus, OrderStatus } from '@/lib/types';
import { RunExpiry } from './AdminBits';

export const metadata = { title: 'Dashboard' };

const PAID = ['paid', 'paid_out_of_stock', 'processing', 'shipped', 'delivered'];

function lagosMidnight(d = new Date()) {
  // Lagos is UTC+1 all year.
  const lagos = new Date(d.getTime() + 3600000);
  return new Date(Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), lagos.getUTCDate()) - 3600000);
}

export default async function Dashboard() {
  const db = createClient();
  const today = lagosMidnight();
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), new Date(today.getTime() + 3600000).getUTCMonth(), 1) - 3600000);

  const [{ data: monthOrders }, { data: toShip }, { data: newCustom }, { data: awaiting }, { data: lowStock }, { data: flagged }] = await Promise.all([
    db.from('orders').select('total, paid_at, refunded_at').in('status', PAID).gte('paid_at', monthStart.toISOString()),
    db.from('orders').select('id, number, status, total, created_at').in('status', ['paid', 'processing']).order('paid_at').limit(20),
    db.from('custom_requests').select('id, number, item_type, status, created_at').in('status', ['submitted']).order('created_at').limit(20),
    db.from('custom_requests').select('id, number, item_type, status, quote_amount, quote_delivery, quote_expires_at').eq('status', 'quoted').order('quote_expires_at').limit(20),
    db.from('product_variants').select('id, size, colour, stock, product:products!inner(id, title, status)').lte('stock', 2).eq('product.status', 'active').order('stock').limit(30),
    db.from('orders').select('id, number, total').eq('status', 'paid_out_of_stock').is('refunded_at', null),
  ]);

  const live = (monthOrders ?? []).filter((o) => !o.refunded_at);
  const todaySales = live.filter((o) => o.paid_at && new Date(o.paid_at) >= today).reduce((a, o) => a + o.total, 0);
  const monthSales = live.reduce((a, o) => a + o.total, 0);

  const tiles = [
    ['Today', naira(todaySales)],
    ['This month', naira(monthSales)],
    ['Orders to ship', String(toShip?.length ?? 0)],
    ['New custom requests', String(newCustom?.length ?? 0)],
    ['Quotes awaiting payment', String(awaiting?.length ?? 0)],
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="h1">Dashboard</h1>
        <RunExpiry />
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {tiles.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-2 bg-espresso p-4 lg:p-5">
            <dt className="label-sm text-muted">{k}</dt>
            <dd className="font-display text-[28px] font-extrabold leading-none [font-stretch:75%] lg:text-[36px]">{v}</dd>
          </div>
        ))}
      </dl>

      {!!flagged?.length && (
        <section className="flex flex-col gap-3 border-t-2 border-accent bg-espresso p-5">
          <h2 className="label text-accent">Paid but out of stock — refund or swap</h2>
          {flagged.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex justify-between gap-4 text-[15px]">
              <span className="font-mono text-[13px]">{o.number}</span>
              <span>{naira(o.total)}</span>
            </Link>
          ))}
        </section>
      )}

      <div className="grid gap-10 lg:grid-cols-2">
        <Panel title="Orders to ship" href="/admin/orders?status=paid">
          {(toShip ?? []).map((o) => (
            <Row key={o.id} href={`/admin/orders/${o.id}`} a={o.number} b={formatDate(o.created_at)} c={naira(o.total)} tag={<StatusTag status={o.status} label={ORDER_STATUS_LABEL[o.status as OrderStatus]} />} />
          ))}
        </Panel>
        <Panel title="New custom requests" href="/admin/custom?status=submitted">
          {(newCustom ?? []).map((r) => (
            <Row key={r.id} href={`/admin/custom/${r.id}`} a={r.number} b={r.item_type} c={formatDate(r.created_at)} tag={<StatusTag status={r.status} label={CUSTOM_STATUS_LABEL[r.status as CustomStatus]} />} />
          ))}
        </Panel>
        <Panel title="Quotes awaiting payment" href="/admin/custom?status=quoted">
          {(awaiting ?? []).map((r) => (
            <Row
              key={r.id}
              href={`/admin/custom/${r.id}`}
              a={r.number}
              b={r.item_type}
              c={naira((r.quote_amount ?? 0) + (r.quote_delivery ?? 0))}
              tag={<span className="text-sm text-muted">until {formatDate(r.quote_expires_at)}</span>}
            />
          ))}
        </Panel>
        <Panel title="Low stock" href="/admin/products">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(lowStock ?? []).map((v: any) => (
            <Row
              key={v.id}
              href={`/admin/products/${v.product.id}`}
              a={v.product.title}
              b={`${v.size} · ${v.colour}`}
              c=""
              tag={<span className={`label ${v.stock === 0 ? 'text-err' : 'text-muted'}`}>{v.stock === 0 ? 'Sold out' : `${v.stock} left`}</span>}
            />
          ))}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  const empty = !Array.isArray(children) || children.length === 0;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="h2">{title}</h2>
        <Link href={href} className="label">
          All
        </Link>
      </div>
      <ul className="border-t border-line">{empty ? <li className="py-4 text-sm text-muted">Nothing here.</li> : children}</ul>
    </section>
  );
}

function Row({ href, a, b, c, tag }: { href: string; a: string; b: string; c: string; tag: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-line py-3.5 text-[15px] text-ink hover:text-ink hover:no-underline">
        <span className="truncate font-medium">{a}</span>
        <span className="text-right font-semibold">{c}</span>
        <span className="truncate text-sm text-muted">{b}</span>
        <span className="text-right">{tag}</span>
      </Link>
    </li>
  );
}
