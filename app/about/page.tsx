import type { Metadata } from 'next';
import Link from 'next/link';
import { Img } from '@/components/Img';
import { Signature } from '@/components/Signature';

export const metadata: Metadata = { title: 'About', description: 'HOLASKEY is a Lagos menswear label for young men who dress for the moment.', alternates: { canonical: '/about' } };

export default function About() {
  return (
    <main className="animate-rise">
      <section className="wrap grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div className="flex flex-col gap-6">
          <p className="label text-muted">About</p>
          <h1 className="display">Cut in Lagos.</h1>
          <p className="accent-word">for the moment</p>
          <p className="max-w-[52ch]">
            HOLASKEY makes designer-level menswear for young Nigerian men: tailored shirts, heavyweight tees, cargos, denim, leather, sets, sneakers and loafers. Small runs, sharp fits, nothing extra.
          </p>
          <p className="max-w-[52ch]">
            Seen something you want and can&apos;t find it in your size? Send us the picture. We&apos;ll quote it within 48 hours and make it to your measurements.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop" className="btn-primary">
              Shop
            </Link>
            <Link href="/custom" className="btn-secondary">
              Custom orders
            </Link>
          </div>
          <Signature className="mt-4" />
        </div>
        <div className="relative aspect-[4/5] bg-smoke">
          <Img src="/img/hk-19168186.jpg" alt="A man in a leather jacket at night" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
        </div>
      </section>
    </main>
  );
}
