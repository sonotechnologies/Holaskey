import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RequestView } from '@/components/request/RequestView';
import { requireViewer } from '@/lib/auth';
import { getSettings } from '@/lib/catalog';
import { processChargeSuccess } from '@/lib/payments';
import { loadRequest } from '@/lib/requests';

export const metadata: Metadata = { title: 'Custom order', robots: { index: false } };

export default async function CustomOrderPage({ params, searchParams }: { params: { id: string }; searchParams: { reference?: string } }) {
  const v = await requireViewer(`/account/custom/${params.id}`);
  let r = await loadRequest(params.id);
  if (!r || r.userId !== v.id) notFound();

  // Back from Paystack: confirm now if the webhook hasn't landed yet.
  if (searchParams.reference && r.status === 'quoted' && r.paystackRef === searchParams.reference) {
    try {
      await processChargeSuccess(searchParams.reference);
      r = (await loadRequest(params.id))!;
    } catch {
      /* the webhook will retry */
    }
  }
  const settings = await getSettings();
  return <RequestView r={r} mode="customer" quoteExpiryDays={settings.quote_expiry_days} />;
}
