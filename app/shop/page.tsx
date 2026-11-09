import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { getWishIds, toCard } from '@/lib/cards';
import { filterProducts, getCategories, getProducts, PRICE_BANDS, type ShopFilters } from '@/lib/catalog';
import { FilterPanel, MobileFilters, SortSelect, type FilterGroup } from './ShopControls';

type SP = Record<string, string | string[] | undefined>;
const list = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : v.split(',')).filter(Boolean);

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const cats = await getCategories();
  const one = list(searchParams.cat);
  const c = one.length === 1 ? cats.find((x) => x.slug === one[0]) : null;
  return {
    title: c ? c.name : searchParams.new ? 'New In' : 'Shop',
    description: c ? `Shop ${c.name.toLowerCase()} at HOLASKEY.` : 'Shop every HOLASKEY piece.',
    alternates: { canonical: c ? `/shop?cat=${c.slug}` : '/shop' },
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
  if (q) items = items.filter((p) => `${p.title} ${p.category?.name ?? ''} ${p.description}`.toLowerCase().includes(q));
  const shown = Math.max(PAGE, Number(searchParams.show) || PAGE);
  const visible = items.slice(0, shown);

  const sizes = Array.from(new Set(all.flatMap((p) => p.variants.map((v) => v.size))));
  const colourMap = new Map<string, string | null>();
  all.forEach((p) => p.variants.forEach((v) => colourMap.set(v.colour, v.colour_hex)));

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
  ];

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
    <main className="wrap pb-16 pt-6 lg:pb-24 lg:pt-12 animate-rise">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="label text-muted">Shop · {count}</p>
          <h1 className="h1">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <MobileFilters groups={groups} count={count} />
          <SortSelect value={f.sort} />
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <ChipLink key={c.key + c.value} chip={c} sp={searchParams} />
          ))}
          <Link href="/shop" className="link px-2">
            Clear all
          </Link>
        </div>
      )}

      <div className="flex items-start gap-12">
        <aside className="sticky top-24 hidden w-[220px] flex-none lg:block" aria-label="Filters">
          <FilterPanel groups={groups} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-10">
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:gap-6">
            {visible.map((p, i) => (
              <ProductCard key={p.id} p={toCard(p, wish)} priority={i < 3} sizes="(max-width:768px) 50vw, 30vw" />
            ))}
          </div>
          {!items.length && <p className="text-muted">Nothing matches those filters. Remove one to see more.</p>}
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
        </div>
      </div>
    </main>
  );
}

function ChipLink({ chip, sp }: { chip: { key: string; value: string; label: string }; sp: SP }) {
  const params = new URLSearchParams();
  Object.entries(sp).forEach(([k, v]) => {
    if (typeof v !== 'string' || k === 'show') return;
    if (k === chip.key) {
      const rest = v.split(',').filter((x) => x !== chip.value && x.toLowerCase() !== chip.value);
      if (rest.length) params.set(k, rest.join(','));
    } else params.set(k, v);
  });
  return (
    <Link
      href={`/shop${params.size ? '?' + params : ''}`}
      aria-label={`Remove filter ${chip.label}`}
      className="label-sm flex h-9 items-center gap-2.5 border border-ink px-3 text-ink hover:text-ink hover:no-underline"
    >
      <span>{chip.label}</span>
      <span aria-hidden>×</span>
    </Link>
  );
}
