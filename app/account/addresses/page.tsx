import type { Metadata } from 'next';
import Link from 'next/link';
import { requireViewer } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Address } from '@/lib/types';
import { AddressCard, AddressForm } from '../forms';

export const metadata: Metadata = { title: 'Addresses', robots: { index: false } };

export default async function AddressesPage({ searchParams }: { searchParams: { edit?: string; new?: string } }) {
  const v = await requireViewer('/account/addresses');
  const { data } = await createClient()
    .from('addresses')
    .select('*')
    .eq('user_id', v.id)
    .order('is_default', { ascending: false })
    .order('created_at');
  const list = (data as Address[]) ?? [];
  const editing = searchParams.edit ? list.find((a) => a.id === searchParams.edit) : undefined;

  if (editing || searchParams.new) {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="h2">{editing ? 'Edit address' : 'New address'}</h2>
        <AddressForm a={editing} />
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((a) => (
        <AddressCard key={a.id} a={a} />
      ))}
      <Link
        href="/account/addresses?new=1"
        className="label flex min-h-[160px] items-center justify-center border border-dashed border-muted text-ink hover:border-ink hover:no-underline"
      >
        + Add address
      </Link>
    </div>
  );
}
