import Link from 'next/link';
import { StatusTag } from '@/components/Status';
import { CUSTOM_STATUS_LABEL, formatDate } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import type { CustomStatus } from '@/lib/types';
import { StatusFilter } from '../StatusFilter';

export const metadata = { title: 'Custom requests' };

const FILTERS: [string, string][] = [
  ['', 'Open'],
  ['submitted', 'New'],
  ['needs_info', 'Waiting on customer'],
  ['quoted', 'Quoted'],
  ['paid', 'Paid'],
  ['in_production', 'In production'],
  ['ready', 'Ready'],
  ['shipped', 'Shipped'],
  ['delivered', 'Delivered'],
  ['declined', 'Declined'],
  ['expired', 'Expired'],
  ['cancelled', 'Cancelled'],
];

export default async function AdminCustom({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status ?? '';
  let q = createClient().from('custom_requests').select('id, number, kind, item_type, status, created_at, needed_by').order('created_at', { ascending: false }).limit(200);
  q = status ? q.eq('status', status) : q.in('status', ['submitted', 'needs_info', 'quoted', 'paid', 'in_production', 'ready', 'shipped']);
  const { data } = await q;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="h1">Custom requests</h1>
      <StatusFilter base="/admin/custom" current={status} options={FILTERS} />
      <ul className="border-t border-line">
        {!data?.length && <li className="py-4 text-muted">Nothing here.</li>}
        {(data ?? []).map((r) => (
          <li key={r.id}>
            <Link href={`/admin/custom/${r.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 border-b border-line py-4 text-[15px] text-ink hover:text-ink hover:no-underline md:grid-cols-5 md:items-center">
              <span className="font-mono text-[13px] font-medium">{r.number}</span>
              <span className="text-right md:order-last">
                <StatusTag status={r.status} label={CUSTOM_STATUS_LABEL[r.status as CustomStatus]} />
              </span>
              <span className="font-medium">
                {r.item_type} <span className="text-muted">· {r.kind}</span>
              </span>
              <span className="text-right text-sm text-muted md:text-left">{formatDate(r.created_at)}</span>
              <span className="text-sm text-muted">{r.needed_by ? `Needed by ${formatDate(r.needed_by)}` : ''}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
