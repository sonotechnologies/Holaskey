'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { SearchIcon } from './icons';
import { startNavProgress } from './NavProgress';

interface Result {
  total: number;
  categories: { name: string; slug: string }[];
  products: { slug: string; title: string; category: string; price: string; image: string | null; soldOut: boolean }[];
}

const POPULAR = ['Leather', 'Sneakers', 'Shirts', 'Denim', 'Loafers', 'Two-piece'];

/** Search with live suggestions (combobox): products with photo and price, categories, and "see all". */
export function SearchBox({ onDone, autoFocus }: { onDone?: () => void; autoFocus?: boolean }) {
  const id = useId();
  const [q, setQ] = useState('');
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const term = q.trim();
    setActive(-1);
    if (term.length < 2) {
      setRes(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d: Result) => setRes(d))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 140);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const go = (href: string) => {
    onDone?.();
    startNavProgress();
    router.push(href);
  };
  const options = res ? [...res.products.map((p) => `/product/${p.slug}`), ...res.categories.map((c) => `/shop?cat=${c.slug}`)] : [];
  const all = `/shop?q=${encodeURIComponent(q.trim())}`;
  const listId = `${id}-list`;
  const optId = (i: number) => `${id}-opt-${i}`;

  return (
    <div className="flex w-full flex-col">
      <form
        role="search"
        className="flex items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (active >= 0 && options[active]) go(options[active]);
          else go(q.trim() ? all : '/shop');
        }}
      >
        <SearchIcon />
        <label htmlFor={`${id}-input`} className="sr-only">
          Search products
        </label>
        <input
          id={`${id}-input`}
          ref={input}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={!!res}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? optId(active) : undefined}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (!options.length) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => (a + 1) % options.length);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => (a <= 0 ? options.length - 1 : a - 1));
            }
          }}
          placeholder="Search shirts, loafers, denim…"
          className="h-12 min-w-0 flex-1 bg-transparent text-lg outline-none"
        />
        {loading && <span className="h-4 w-4 flex-none animate-spin rounded-full border-2 border-line border-t-accent" aria-hidden />}
      </form>

      {!res && (
        <div className="flex flex-wrap items-center gap-2 pb-4 pt-1">
          <span className="label-sm mr-1 text-muted">Popular</span>
          {POPULAR.map((p) => (
            <button key={p} type="button" onClick={() => setQ(p)} className="label-sm h-9 border border-line px-3 hover:border-ink">
              {p}
            </button>
          ))}
        </div>
      )}

      {res && (
        <div id={listId} role="listbox" aria-label="Suggestions" className="flex max-h-[60vh] flex-col overflow-y-auto pb-4">
          {res.products.length === 0 && res.categories.length === 0 ? (
            <p className="py-4 text-[15px] text-muted">
              Nothing found for “{q.trim()}”. Try a category, or{' '}
              <Link href="/custom" onClick={onDone} className="underline underline-offset-4">
                have it made
              </Link>
              .
            </p>
          ) : (
            <>
              {res.products.map((p, i) => (
                <Link
                  key={p.slug}
                  id={optId(i)}
                  role="option"
                  aria-selected={active === i}
                  href={`/product/${p.slug}`}
                  onClick={onDone}
                  onMouseEnter={() => setActive(i)}
                  className={`grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line py-2.5 text-ink hover:text-ink hover:no-underline ${active === i ? 'bg-smoke' : ''}`}
                >
                  <span className="relative aspect-[4/5] overflow-hidden bg-smoke">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.image && <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />}
                  </span>
                  <span className="flex min-w-0 flex-col leading-snug">
                    <span className="label-sm text-muted">{p.category}</span>
                    <span className="truncate font-medium">{p.title}</span>
                  </span>
                  <span className="text-right text-sm font-semibold">{p.soldOut ? <span className="label-sm text-muted">Sold out</span> : p.price}</span>
                </Link>
              ))}
              {res.categories.map((c, j) => {
                const i = res.products.length + j;
                return (
                  <Link
                    key={c.slug}
                    id={optId(i)}
                    role="option"
                    aria-selected={active === i}
                    href={`/shop?cat=${c.slug}`}
                    onClick={onDone}
                    onMouseEnter={() => setActive(i)}
                    className={`label flex min-h-12 items-center justify-between border-b border-line hover:no-underline ${active === i ? 'bg-smoke' : ''}`}
                  >
                    <span>All {c.name}</span>
                    <span aria-hidden>→</span>
                  </Link>
                );
              })}
              {res.total > res.products.length && (
                <Link href={all} onClick={onDone} className="label mt-3 self-start underline underline-offset-4">
                  See all {res.total} results
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
