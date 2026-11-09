import { notFound } from 'next/navigation';
import { RequestView } from '@/components/request/RequestView';
import { getSettings } from '@/lib/catalog';
import { loadRequest } from '@/lib/requests';

export const metadata = { title: 'Custom request' };

export default async function AdminRequest({ params }: { params: { id: string } }) {
  const [r, settings] = await Promise.all([loadRequest(params.id), getSettings()]);
  if (!r) notFound();
  return <RequestView r={r} mode="admin" quoteExpiryDays={settings.quote_expiry_days} />;
}
