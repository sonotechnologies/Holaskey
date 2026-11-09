import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Signature } from '@/components/Signature';
import { StatusTag } from '@/components/Status';
import { requireViewer } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Request received', robots: { index: false } };

export default async function Submitted({ searchParams }: { searchParams: { id?: string } }) {
  const v = await requireViewer('/account/custom');
  if (!searchParams.id) notFound();
  const supabase = createClient();
  const { data: r } = await supabase
    .from('custom_requests')
    .select('id, number, images:custom_request_images(path, note)')
    .eq('id', searchParams.id)
    .eq('user_id', v.id)
    .maybeSingle();
  if (!r) notFound();
  const paths = (r.images as { path: string; note: string }[]).map((i) => i.path);
  const { data: signed } = paths.length ? await supabase.storage.from('custom-refs').createSignedUrls(paths, 3600) : { data: [] };

  return (
    <main className="px-4 py-16 lg:py-28 animate-rise">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6">
        <p className="label text-muted">Request {r.number}</p>
        <h1 className="display !leading-[.92]">Request received.</h1>
        <p className="text-lg">We&apos;ll send your quote within 48 hours.</p>
        <div className="flex flex-wrap gap-2">
          {(signed ?? []).map((s, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={s.signedUrl ?? undefined} alt={(r.images as { note: string }[])[i]?.note || 'Reference photo'} className="aspect-[4/5] w-[88px] bg-smoke object-cover" />
          ))}
        </div>
        <StatusTag status="submitted" label="Submitted" />
        <div className="flex flex-wrap gap-3">
          <Link href="/shop" className="btn-primary">
            Back to shop
          </Link>
          <Link href={`/account/custom/${r.id}`} className="btn-secondary">
            View my request
          </Link>
        </div>
        <Signature className="mt-6" />
      </div>
    </main>
  );
}
