import type { Metadata } from 'next';
import { requireViewer } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import type { Measurements } from '@/lib/types';
import { MeasurementsForm } from '../forms';

export const metadata: Metadata = { title: 'Measurements', robots: { index: false } };

export default async function MeasurementsPage() {
  const v = await requireViewer('/account/measurements');
  const { data } = await createClient().from('measurements').select('*').eq('user_id', v.id).maybeSingle();
  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted">
        Saved measurements prefill every custom order.
        {data?.updated_at ? ` Last updated ${formatDate(data.updated_at)}.` : ''}
      </p>
      <MeasurementsForm m={data as Measurements | null} />
    </div>
  );
}
