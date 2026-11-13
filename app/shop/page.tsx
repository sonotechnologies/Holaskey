import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { getWishIds, toCard } from '@/lib/cards';
import { shareMeta } from '@/lib/og';
import { searchProducts } from '@/lib/search';
import { filterProducts, getCategories, getProducts, PRICE_BANDS, type ShopFilters } from '@/lib/catalog';
import { FilterAside, ShopProvider, ShopResults, ShopToolbar, type FilterGroup } from './ShopControls';

type SP = Record<string, string | string[] | undefined>;
const list = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : v.split(',')).filter(Boolean);

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const cats = await getCategories();
  const one = list(searchParams.cat);
  const c = one.length === 1 ? cats.find((x) => x.slug === one[0]) : null;
  const title = c ? c.name : searchParams.new ? 'New In' : 'Shop';
  const description = c
    ? `${c.name} from HOLASKEY, cut in Lagos. Flat delivery anywhere in Nigeria.`
    : 'Shirts, tees, cargos, denim, jackets, sets, sneakers and loafers. Flat delivery anywhere in Nigeria.';
  const path = c ? `/shop?cat=${c.slug}` : '/shop';
  return {
    title,
    description,
    alternates: { canonical: path },
    ...shareMeta({ title: `${title} · HOLASKEY`, description, path, image: '/og?p=shop', alt: 'Shop HOLASKEY' }),
  };
}

const PAGE = 9;

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const [all, categories, wish] = await Promise.all([getProducts(), getCategories(), getWishIds()]);
  const f: ShopFilters = {
    cats: list(searchParams.cat),
    sizes: list(searchParams.size),
    colours: list(searchParams.colour),
    price: typeof searchParams.price === 'string' ? searchParams.price : null,
    sort: searchParams.sort === 'low' || searchParams.sort === 'high' ? searchParams.sort : 'new',
  };
  const q = typeof searchParams.q === 'string' ? searchParams.q.trim().toLowerCase() : '';
  const newOnly = searchParams.new === '1';
  let items = filterProducts(all, f, categories);
  if (newOnly) items = items.filter((p) => p.is_new);
  if (q) items = searchProducts(items, q);
  const shown = Math.max(PAGE, Number(searchParams.show) || PAGE);
  const visible = items.slice(0, shown);

  const sizes = Array.from(new Set(all.flatMap((p) => p.variants.map((v) => v.size))));
  const colourMap = new Map<string, string | null>();
  all.forEach((p) => p.variants.forEach((v) => colourMap.set(v.colour, v.colour_hex)));

  // Facet counts: how many products each option would show, given the other active filters.
  const EMPTY: ShopFilters = { cats: [], sizes: [], colours: [], price: null, sort: f.sort };
  const FIELD = { cat: 'cats', size: 'sizes', colour: 'colours', price: 'price' } as const;
  const scope = (list: typeof all) => {
    let l = newOnly ? list.filter((p) => p.is_new) : list;
    if (q) l = searchProducts(l, q);
    return l;
  };
  const baseFor = new Map(
    (Object.keys(FIELD) as (keyof typeof FIELD)[]).map((k) => [k, scope(filterProducts(all, { ...f, [FIELD[k]]: k === 'price' ? null : [] }, categories))]),
  );
  const countFor = (key: keyof typeof FIELD, value: string) =>
    filterProducts(baseFor.get(key)!, { ...EMPTY, [FIELD[key]]: key === 'price' ? value : [value] }, categories).length;
  const withCounts = (g: FilterGroup): FilterGroup => ({ ...g, opts: g.opts.map((o) => ({ ...o, count: countFor(g.key as keyof typeof FIELD, o.value) })) });

  const groups: FilterGroup[] = [
    {
      key: 'cat',
      title: 'Category',
      full: true,
      opts: [
        { value: 'clothing', label: 'All clothing' },
        { value: 'shoes', label: 'All shoes' },
        ...categories.map((c) => ({ value: c.slug, label: c.name })),
      ],
    },
    { key: 'size', title: 'Size', opts: sizes.map((s) => ({ value: s, label: s })) },
    { key: 'colour', title: 'Colour', opts: Array.from(colourMap, ([c, hex]) => ({ value: c, label: c, hex })) },
    { key: 'price', title: 'Price', full: true, single: true, opts: PRICE_BANDS.map((b) => ({ value: b.key, label: b.label })) },
  ].map(withCounts);

  const labelFor = (key: string, value: string) =>
    groups.find((g) => g.key === key)?.opts.find((o) => o.value === value)?.label ?? value;
  const chips = [
    ...f.cats.map((v) => ({ key: 'cat', value: v, label: labelFor('cat', v) })),
    ...f.sizes.map((v) => ({ key: 'size', value: v, label: 'Size ' + v })),
    ...f.colours.map((v) => ({ key: 'colour', value: v, label: v })),
    ...(f.price ? [{ key: 'price', value: f.price, label: labelFor('price', f.price) }] : []),
    ...(newOnly ? [{ key: 'new', value: '1', label: 'New in' }] : []),
    ...(q ? [{ key: 'q', value: q, label: `“${q}”` }] : []),
  ];

  const oneCat = f.cats.length === 1 ? categories.find((c) => c.slug === f.cats[0]) : null;
  const title = q ? 'Search' : oneCat ? oneCat.name : newOnly ? 'New In' : f.cats[0] === 'shoes' ? 'Shoes' : f.cats[0] === 'clothing' ? 'Clothing' : 'All pieces';
  const count = `${items.length} ${items.length === 1 ? 'piece' : 'pieces'}`;

  const moreParams = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => typeof v === 'string' && k !== 'show' && moreParams.set(k, v));
  moreParams.set('show', String(shown + PAGE));

  return (
    <main className="wrap pb-16 pt-6 lg:pb-24 lg:pt-12">
      <div className="mb-2 flex flex-col gap-2">
        <p className="label text-muted">Shop · {count}</p>
        <h1 className="h1">{title}</h1>
      </div>

      <ShopProvider>
        <ShopToolbar groups={groups} chips={chips} count={count} />
        <div className="flex items-start gap-12">
          <FilterAside groups={groups} />
          <ShopResults>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:gap-6">
              {visible.map((p, i) => (
                <ProductCard key={p.id} p={toCard(p, wish)} priority={i < 3} sizes="(max-width:768px) 50vw, 30vw" />
              ))}
            </div>
            {!items.length && (
              <div className="flex flex-col gap-10 py-4">
                <div className="flex flex-col items-start gap-4">
                  <p className="text-lg">{q ? `Nothing found for “${q}”.` : 'Nothing matches those filters.'}</p>
                  <p className="max-w-[52ch] text-muted">Remove a filter to see more — or send us a photo of what you want and we’ll make it in your size.</p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/shop" className="btn-secondary">
                      Clear all filters
                    </Link>
                    <Link href="/custom" className="btn-primary">
                      Have it made
                    </Link>
                  </div>
                </div>
                <div>
                  <h2 className="h2 mb-6">New in</h2>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 lg:gap-6">
                    {all
                      .filter((p) => p.is_new)
                      .slice(0, 4)
                      .map((p) => (
                        <ProductCard key={p.id} p={toCard(p, wish)} />
                      ))}
                  </div>
                </div>
              </div>
            )}
            {items.length > 0 && (
              <div className="flex flex-col items-center gap-3">
                <span className="label text-muted">
                  Showing {visible.length} of {items.length}
                </span>
                {items.length > shown && (
                  <Link href={`/shop?${moreParams}`} scroll={false} className="btn-secondary">
                    Load more
                  </Link>
                )}
              </div>
            )}
          </ShopResults>
        </div>
      </ShopProvider>
    </main>
  );
}
