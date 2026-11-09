import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusTag } from '@/components/Status';
import { requireViewer } from '@/lib/auth';
import { CUSTOM_STATUS_LABEL, formatDate } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import type { CustomStatus } from '@/lib/types';

export const metadata: Metadata = { title: 'Custom orders', robots: { index: false } };

export default async function CustomOrders() {
  const v = await requireViewer('/account/custom');
  const { data } = await createClient()
    .from('custom_requests')
    .select('id, number, item_type, status, created_at')
    .eq('user_id', v.id)
    .order('created_at', { ascending: false });
  return (
    <div className="flex flex-col items-start gap-6">
      {data?.length ? (
        <ul className="w-full border-t border-line">
          {data.map((o) => (
            <li key={o.id}>
              <Link
                href={`/account/custom/${o.id}`}
                className="grid grid-cols-2 items-center gap-x-6 gap-y-2 border-b border-line py-5 text-[15px] text-ink hover:text-ink hover:no-underline md:grid-cols-4"
              >
                <span className="font-mono text-[13px] font-medium tracking-[0.08em]">{o.number}</span>
                <span className="font-medium">{o.item_type}</span>
                <span className="text-muted">{formatDate(o.created_at)}</span>
                <StatusTag status={o.status} label={CUSTOM_STATUS_LABEL[o.status as CustomStatus]} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">No custom orders yet. Seen something you want? Send us the pic.</p>
      )}
      <Link href="/custom" className="btn-secondary">
        Start a custom order
      </Link>
    </div>
  );
}
