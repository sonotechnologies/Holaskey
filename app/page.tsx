import Link from 'next/link';
import { Img } from '@/components/Img';
import { ProductCard } from '@/components/ProductCard';
import { Reveal } from '@/components/Reveal';
import { Signature } from '@/components/Signature';
import { getWishIds, toCard } from '@/lib/cards';
import { getCategories, getProducts, getSettings } from '@/lib/catalog';
import { DEMO_LOOKS, INSTAGRAM_IMAGES } from '@/lib/demo';
import { productImageUrl } from '@/lib/images';

export default async function Home() {
  const [products, categories, settings, wish] = await Promise.all([getProducts(), getCategories(), getSettings(), getWishIds()]);
  const newIn = [...products.filter((p) => p.is_new), ...products.filter((p) => !p.is_new)].slice(0, 8);
  const hero = productImageUrl(settings.hero_images[0]) ?? '/img/hero.jpg';
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  return (
    <main>
      {/* Hero: one full-bleed photo, display headline, Bodoni accent, two buttons. Logo is not repeated. */}
      <section className="relative h-[clamp(600px,52vw,780px)] overflow-hidden bg-smoke">
        <Img src={hero} alt="A man in a dark leather jacket on a Lagos street at night" fill priority sizes="100vw" className="object-cover object-[center_35%]" />
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-bg/90 to-bg/0" />
        <div className="absolute inset-x-0 bottom-[clamp(40px,5vw,72px)]">
          <div className="wrap flex flex-col gap-6 animate-rise">
            <p className="accent-word">the new season</p>
            <h1 className="display max-w-[9.5em]">Dressed for the moment.</h1>
            <div className="flex flex-wrap gap-3">
              <Link href="/shop?new=1" className="btn-primary">
                Shop New In
              </Link>
              <Link href="/custom" className="btn-secondary">
                Start a custom order
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* New In: horizontal scroll of 8 cards */}
      <Reveal className="pt-16 lg:pt-24">
        <div className="wrap mb-6 flex items-baseline justify-between gap-4">
          <h2 className="h2">New In</h2>
          <Link href="/shop?new=1" className="label">
            View all
          </Link>
        </div>
        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 md:px-8 lg:gap-6 xl:px-[max(60px,calc((100vw_-_1320px)/2))]">
          {newIn.map((p) => (
            <div key={p.id} className="w-[clamp(230px,21vw,300px)] flex-none snap-start">
              <ProductCard p={toCard(p, wish)} sizes="300px" />
            </div>
          ))}
        </div>
      </Reveal>

      {/* Shop by category */}
      <Reveal className="wrap pt-16 lg:pt-24">
        <h2 className="h2 mb-6">Shop by category</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/shop?cat=${c.slug}`}
              className="motion-zoom relative block aspect-[4/5] overflow-hidden bg-smoke text-ink transition-transform duration-[400ms] ease-out hover:scale-[1.02] hover:text-ink hover:no-underline"
            >
              {c.image_path && <Img src={productImageUrl(c.image_path)!} alt="" fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover" />}
              <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-bg/85 to-bg/0" />
              <span className="absolute bottom-3 left-3 right-3 font-display text-[17px] font-bold uppercase leading-tight lg:bottom-5 lg:left-5 lg:text-2xl">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </Reveal>

      {/* Custom order band on espresso */}
      <Reveal className="mt-16 bg-espresso py-16 lg:mt-24 lg:py-24">
        <div className="wrap grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex max-w-[480px] flex-col gap-6">
            <p className="label text-muted">Custom orders</p>
            <h2 className="display !text-[clamp(40px,4.2vw,60px)] !leading-[.95]">Seen it somewhere? Send the pic.</h2>
            <p>Seen it somewhere? Send the pic. We&apos;ll make it in your size.</p>
            <div>
              <Link href="/custom" className="btn-primary">
                Start a custom order
              </Link>
            </div>
            <Signature className="mt-2" />
          </div>
          <div className="grid grid-cols-3 gap-2 lg:gap-4">
            {[
              ['Shirt', '/img/hk-7562644.jpg', '/img/hk-935966.jpg'],
              ['Two-piece', '/img/hk-6311503.jpg', '/img/hk-7562644.jpg'],
              ['Loafer', '/img/hk-12628400.jpg', '/img/hk-935966.jpg'],
            ].map(([name, ref, done]) => (
              <div key={name} className="flex flex-col gap-2">
                <div className="relative aspect-[4/5] bg-smoke">
                  <Img src={ref} alt={`Reference photo for a ${name.toLowerCase()}`} fill sizes="200px" className="object-cover" />
                  <span className="label-sm absolute bottom-2 left-2 text-[10px] text-[#F7F2EB] [text-shadow:0_1px_3px_rgba(0,0,0,.6)]">Reference</span>
                </div>
                <div className="relative aspect-[4/5] bg-bg">
                  <Img src={done} alt={`Finished HOLASKEY ${name.toLowerCase()}`} fill sizes="200px" className="object-cover" />
                  <span className="label-sm absolute bottom-2 left-2 text-[10px] text-[#F7F2EB] [text-shadow:0_1px_3px_rgba(0,0,0,.6)]">Finished piece</span>
                </div>
                <span className="label-sm">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Lookbook strip */}
      <Reveal className="wrap pt-16 lg:pt-24">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="h2">Lookbook</h2>
          <Link href="/lookbook" className="label">
            All looks
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3 lg:gap-6">
          {DEMO_LOOKS.map((l) => {
            const first = bySlug.get(l.slugs[0]);
            return (
              <div key={l.no} className="flex flex-col gap-3">
                <div className="relative aspect-[4/3] bg-smoke">
                  <Img src={l.img} alt={`${l.name}: ${l.desc}`} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-lg font-bold uppercase">
                    {l.no.replace('LOOK', 'Look')} — {l.name}
                  </h3>
                  <Link href={first ? `/product/${first.slug}` : '/lookbook'} className="label whitespace-nowrap">
                    Shop the look
                  </Link>
                </div>
                <p className="-mt-2 text-sm text-muted">
                  {l.slugs
                    .map((s) => bySlug.get(s)?.title)
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            );
          })}
        </div>
      </Reveal>

      {/* Instagram strip */}
      <Reveal className="wrap py-16 lg:py-24">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
          <p className="label">@shopwithholaskey</p>
          <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="label">
            Follow on Instagram
          </a>
        </div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {INSTAGRAM_IMAGES.map((src) => (
            <div key={src} className="relative aspect-square bg-smoke">
              <Img src={src} alt="HOLASKEY on Instagram" fill sizes="(max-width:768px) 33vw, 16vw" className="object-cover" />
            </div>
          ))}
        </div>
      </Reveal>
    </main>
  );
}
