import type { Metadata } from 'next';
import Link from 'next/link';
import { Img } from '@/components/Img';
import { getViewer } from '@/lib/auth';
import { getProduct } from '@/lib/catalog';
import { hasSupabase } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { shareMeta } from '@/lib/og';
import type { Measurements } from '@/lib/types';
import { CustomForm } from './CustomForm';

const DESCRIPTION = 'Seen it somewhere? Send us the pic — we make it in your size. Clothing and shoes, quoted within 48 hours.';
export const metadata: Metadata = {
  title: 'Custom orders',
  description: DESCRIPTION,
  alternates: { canonical: '/custom' },
  ...shareMeta({ title: "Send the pic. We'll make it. · HOLASKEY", description: DESCRIPTION, path: '/custom', image: '/og?p=custom', alt: "HOLASKEY custom orders — send the pic, we'll make it" }),
};

export default async function CustomPage({ searchParams }: { searchParams: { product?: string } }) {
  const viewer = await getViewer();
  const product = searchParams.product ? await getProduct(searchParams.product) : null;
  let saved: Measurements | null = null;
  if (viewer) {
    const { data } = await createClient().from('measurements').select('*').eq('user_id', viewer.id).maybeSingle();
    saved = data as Measurements | null;
  }
  const next = `/custom${product ? `?product=${product.slug}` : ''}`;

  return (
    <main className="animate-rise">
      <section className="wrap py-12 lg:py-24">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-6">
            <p className="label text-accent">Custom</p>
            <h1 className="display">Send the pic. We&apos;ll make it.</h1>
            <p className="accent-word">in your size</p>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 lg:gap-4">
            <div className="relative aspect-[4/5] bg-smoke">
              <Img src="/img/hk-7562644.jpg" alt="A reference photo a customer sent" fill priority sizes="(max-width:1024px) 45vw, 25vw" className="object-cover" />
              <span className="label-sm absolute bottom-3 left-3 text-[#F7F2EB] [text-shadow:0_1px_3px_rgba(0,0,0,.6)]">Reference screenshot</span>
            </div>
            <span className="font-mono text-sm text-muted" aria-hidden>
              →
            </span>
            <div className="relative aspect-[4/5] bg-espresso">
              <Img src="/img/hk-935966.jpg" alt="The finished HOLASKEY piece" fill priority sizes="(max-width:1024px) 45vw, 25vw" className="object-cover" />
              <span className="label-sm absolute bottom-3 left-3 text-[#F7F2EB] [text-shadow:0_1px_3px_rgba(0,0,0,.6)]">Finished HOLASKEY piece</span>
            </div>
          </div>
        </div>
        <ol className="mt-12 grid border-t border-line md:grid-cols-3 lg:mt-[72px]">
          {['Send your look', 'Get a quote', 'Pay and we make it'].map((t, i) => (
            <li key={t} className="flex items-baseline gap-4 border-b border-line py-5">
              <span className="label text-muted">0{i + 1}</span>
              <span className="font-display text-xl font-bold uppercase">{t}</span>
            </li>
          ))}
        </ol>
      </section>

      <section id="request" className="bg-espresso px-4 py-12 md:px-8 lg:py-24">
        <div className="mx-auto max-w-[880px]">
          {viewer ? (
            <CustomForm
              userId={viewer.id}
              saved={saved}
              product={product ? { slug: product.slug, title: product.title, kind: product.category?.type ?? 'clothing' } : null}
            />
          ) : (
            <div className="flex flex-col items-start gap-5">
              <h2 className="h2">Ready to send your look?</h2>
              <p>Log in or create an account so we can send your quote and keep your photos private.</p>
              {hasSupabase ? (
                <div className="flex flex-wrap gap-3">
                  <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn-primary">
                    Log in to start
                  </Link>
                  <Link href={`/signup?next=${encodeURIComponent(next)}`} className="btn-secondary">
                    Create account
                  </Link>
                </div>
              ) : (
                <p className="text-muted">Accounts are not connected yet.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
