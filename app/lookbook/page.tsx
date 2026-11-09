import type { Metadata } from 'next';
import Link from 'next/link';
import { Img } from '@/components/Img';
import { Reveal } from '@/components/Reveal';
import { getProducts } from '@/lib/catalog';
import { DEMO_LOOKS } from '@/lib/demo';
import { naira } from '@/lib/format';

export const metadata: Metadata = { title: 'Lookbook', description: 'HOLASKEY Lookbook, Season 04: after dark.', alternates: { canonical: '/lookbook' } };

export default async function Lookbook() {
  const products = await getProducts();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  return (
    <main className="pb-16 lg:pb-24 animate-rise">
      <div className="wrap flex flex-col gap-4 pb-8 pt-12 lg:pb-12 lg:pt-[72px]">
        <p className="label text-muted">Lookbook · Season 04</p>
        <h1 className="display">The looks</h1>
        <p className="accent-word">after dark</p>
      </div>
      {DEMO_LOOKS.map((l, i) => {
        const pieces = l.slugs.map((s) => bySlug.get(s)).filter(Boolean);
        return (
          <Reveal key={l.no} className="mt-10 lg:mt-16">
            <div className="relative aspect-[4/5] bg-smoke md:aspect-[16/7]">
              <Img src={l.img} alt={`${l.name}: ${l.desc}`} fill priority={i === 0} sizes="100vw" className="object-cover object-[center_30%]" />
            </div>
            <div className="wrap grid gap-6 pt-6 md:grid-cols-2 lg:gap-16">
              <div className="flex flex-col gap-2">
                <span className="label text-muted">{l.no}</span>
                <h2 className="h2">{l.name}</h2>
                <p className="max-w-[44ch] text-muted">{l.desc}</p>
              </div>
              <ul className="border-t border-line">
                {pieces.map((p) => (
                  <li key={p!.id}>
                    <Link href={`/product/${p!.slug}`} className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-b border-line text-ink hover:text-ink hover:no-underline">
                      <span className="font-medium">{p!.title}</span>
                      <span className="font-semibold">{naira(p!.price)}</span>
                      <span className="label underline underline-offset-4">Shop</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        );
      })}
    </main>
  );
}
