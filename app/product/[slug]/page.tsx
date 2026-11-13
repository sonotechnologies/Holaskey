import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/ProductCard';
import { getWishIds, toCard } from '@/lib/cards';
import { getProduct, getProducts, getSettings, isSoldOut } from '@/lib/catalog';
import { SITE_URL } from '@/lib/env';
import { naira } from '@/lib/format';
import { productImageUrl } from '@/lib/images';
import { shareMeta } from '@/lib/og';
import { RecentlyViewed, RecordView } from '@/components/RecentlyViewed';
import { Gallery, ProductBuy } from './ProductClient';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getProduct(params.slug);
  if (!p) return { title: 'Not found' };
  const description = `${naira(p.price)} · ${p.category?.name ?? 'HOLASKEY'}. ${p.description}`.slice(0, 155);
  const path = `/product/${p.slug}`;
  return {
    title: p.title,
    description,
    alternates: { canonical: path },
    ...shareMeta({ title: `${p.title} — ${naira(p.price)}`, description, path, image: `/og?p=product&slug=${encodeURIComponent(p.slug)}`, alt: p.images[0]?.alt || p.title }),
  };
}

export default async function ProductPage({ params, searchParams }: { params: { slug: string }; searchParams: { v?: string } }) {
  const [p, all, settings, wish] = await Promise.all([getProduct(params.slug), getProducts(), getSettings(), getWishIds()]);
  if (!p) notFound();

  const others = all.filter((x) => x.id !== p.id);
  const sameCat = others.filter((x) => x.category?.type !== p.category?.type);
  const completeLook = [...sameCat, ...others].slice(0, 4);
  const alsoLike = others.filter((x) => x.category?.id === p.category?.id).concat(others).filter((x, i, a) => a.indexOf(x) === i && !completeLook.includes(x)).slice(0, 4);

  const shoe = p.category?.type === 'shoes';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    description: p.description,
    sku: p.variants[0]?.sku ?? p.id,
    brand: { '@type': 'Brand', name: 'HOLASKEY' },
    category: p.category?.name,
    image: p.images.map((i) => {
      const u = productImageUrl(i.path)!;
      return u.startsWith('http') ? u : SITE_URL + u;
    }),
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${p.slug}`,
      priceCurrency: 'NGN',
      price: (p.price / 100).toFixed(2),
      availability: isSoldOut(p) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <main className="wrap pb-24 pt-4 lg:pt-8">
      <RecordView slug={p.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Shop', item: `${SITE_URL}/shop` },
              ...(p.category ? [{ '@type': 'ListItem', position: 2, name: p.category.name, item: `${SITE_URL}/shop?cat=${p.category.slug}` }] : []),
              { '@type': 'ListItem', position: p.category ? 3 : 2, name: p.title, item: `${SITE_URL}/product/${p.slug}` },
            ],
          }).replace(/</g, '\\u003c'),
        }}
      />
      <nav aria-label="Breadcrumb" className="label-sm mb-4 flex gap-2 text-muted lg:mb-6">
        <Link href="/shop" className="text-muted">
          Shop
        </Link>
        <span aria-hidden>/</span>
        {p.category && (
          <Link href={`/shop?cat=${p.category.slug}`} className="text-muted">
            {p.category.name}
          </Link>
        )}
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-16">
        <Gallery images={p.images.map((i) => ({ src: productImageUrl(i.path)!, alt: i.alt || p.title }))} shoe={shoe} />
        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="label text-muted">{p.category?.name}</span>
              {p.is_new && <span className="label text-accent">New</span>}
            </div>
            <h1 className="h1">{p.title}</h1>
            <p className="flex items-baseline gap-3 text-lg font-semibold">
              {naira(p.price)}
              {p.compare_at_price && p.compare_at_price > p.price && (
                <s className="text-base font-normal text-muted">{naira(p.compare_at_price)}</s>
              )}
            </p>
          </div>

          <ProductBuy
            productId={p.id}
            slug={p.slug}
            title={p.title}
            price={p.price}
            image={productImageUrl(p.images[0]?.path)}
            initialVariant={searchParams.v}
            whatsapp={settings.whatsapp}
            sizeKind={shoe ? 'shoes' : /trouser|cargo|denim|jean/i.test(`${p.category?.name ?? ''} ${p.title}`) ? 'bottoms' : 'tops'}
            variants={p.variants}
            wished={wish.has(p.id)}
            shoe={shoe}
            accordions={[
              { key: 'desc', title: 'Description', body: p.description },
              { key: 'care', title: 'Fabric & care', body: p.care || '—' },
              {
                key: 'delivery',
                title: 'Delivery',
                body: `Flat delivery fee of ${naira(settings.delivery_fee)} anywhere in Nigeria. Lagos orders arrive in 1–2 days, elsewhere in 3–5.`,
              },
            ]}
          />

          <div className="flex flex-col gap-3 border-t-2 border-accent bg-espresso p-6">
            <p className="accent-word !text-[28px]">made to measure</p>
            <p>Want this in a different colour or fit? Request a custom version.</p>
            <Link href={`/custom?product=${p.slug}`} className="label underline underline-offset-4">
              Request a custom version
            </Link>
          </div>
        </div>
      </div>

      {[
        { title: 'Complete the look', items: completeLook },
        { title: 'You may also like', items: alsoLike },
      ].map((rail) =>
        rail.items.length ? (
          <section key={rail.title} className="pt-16 lg:pt-24">
            <h2 className="h2 mb-6">{rail.title}</h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 lg:gap-6">
              {rail.items.map((x) => (
                <ProductCard key={x.id} p={toCard(x, wish)} />
              ))}
            </div>
          </section>
        ) : null,
      )}
      <RecentlyViewed exclude={p.slug} className="pt-16 lg:pt-24" />
    </main>
  );
}
