'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { CloseIcon, FilterIcon } from '@/components/icons';
import { Portal } from '@/components/Portal';

export interface FilterGroup {
  key: string;
  title: string;
  full?: boolean;
  single?: boolean;
  opts: { value: string; label: string; hex?: string | null; count?: number }[];
}
export interface ActiveChip {
  key: string;
  value: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Shared state: every filter change runs in a transition, so the current grid stays
// on screen (dimmed) while the new results load, instead of flashing a skeleton.
// ---------------------------------------------------------------------------
const Ctx = createContext<{ pending: boolean; go: (params: URLSearchParams) => void }>({ pending: false, go: () => {} });

export function ShopProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [pending, start] = useTransition();
  const go = (params: URLSearchParams) => {
    params.delete('show');
    start(() => router.replace(`${path}${params.size ? '?' + params : ''}`, { scroll: false }));
  };
  return <Ctx.Provider value={{ pending, go }}>{children}</Ctx.Provider>;
}

function useFilters() {
  const { pending, go } = useContext(Ctx);
  const sp = useSearchParams();
  const values = (key: string) => (sp.get(key) ?? '').split(',').filter(Boolean);
  const toggle = (g: { key: string; single?: boolean }, value: string) => {
    const params = new URLSearchParams(sp.toString());
    const cur = values(g.key);
    const next = g.single ? (cur.includes(value) ? [] : [value]) : cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    if (next.length) params.set(g.key, next.join(','));
    else params.delete(g.key);
    go(params);
  };
  const remove = (key: string, value: string) => {
    if (key !== 'new' && key !== 'q') return toggle({ key }, value);
    const params = new URLSearchParams(sp.toString());
    params.delete(key);
    go(params);
  };
  const clear = () => {
    const params = new URLSearchParams();
    const sort = sp.get('sort');
    if (sort) params.set('sort', sort);
    go(params);
  };
  const setSort = (v: string) => {
    const params = new URLSearchParams(sp.toString());
    if (v === 'new') params.delete('sort');
    else params.set('sort', v);
    go(params);
  };
  return { pending, values, toggle, remove, clear, setSort, sort: sp.get('sort') ?? 'new' };
}

// ---------------------------------------------------------------------------
// Filter options (desktop column and mobile sheet)
// ---------------------------------------------------------------------------
export function FilterPanel({ groups, touch = false }: { groups: FilterGroup[]; touch?: boolean }) {
  const { values, toggle } = useFilters();
  return (
    <div className="flex flex-col gap-8">
      {groups.map((g) => {
        const on = values(g.key);
        return (
          <fieldset key={g.key} className="flex flex-col">
            <legend className="label mb-3 flex w-full items-center justify-between text-muted">
              {g.title}
              {on.length > 0 && <span className="text-accent">{on.length}</span>}
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {g.opts.map((o) => {
                const active = on.includes(o.value);
                const empty = o.count === 0 && !active;
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={active}
                    disabled={empty}
                    aria-label={o.count !== undefined ? `${o.label}, ${o.count} ${o.count === 1 ? 'piece' : 'pieces'}` : undefined}
                    onClick={() => toggle(g, o.value)}
                    className={`chip ${touch ? 'min-h-11' : 'min-h-10'} ${g.full ? 'w-full justify-start text-left' : ''} ${active ? 'chip-on' : ''} ${empty ? 'cursor-not-allowed opacity-35 hover:border-line' : ''}`}
                  >
                    {o.hex !== undefined && <span className="h-3.5 w-3.5 flex-none border border-line" style={{ background: o.hex ?? 'transparent' }} aria-hidden />}
                    <span>{o.label}</span>
                    {g.full && o.count !== undefined && <span className={`ml-auto font-normal ${active ? 'text-bg/70' : 'text-muted'}`}>{o.count}</span>}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

/** Desktop filter column: sticks below the header and toolbar and scrolls on its own. */
export function FilterAside({ groups }: { groups: FilterGroup[] }) {
  return (
    <aside
      aria-label="Filters"
      className="sticky top-[148px] hidden max-h-[calc(100vh-164px)] w-[220px] flex-none overflow-y-auto overscroll-contain pb-6 pr-2 [scrollbar-width:thin] lg:block"
    >
      <FilterPanel groups={groups} />
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Sticky toolbar: Filters (mobile), active chips, count, sort — always in reach.
// ---------------------------------------------------------------------------
export function ShopToolbar({ groups, chips, count }: { groups: FilterGroup[]; chips: ActiveChip[]; count: string }) {
  const { pending, remove, clear, setSort, sort } = useFilters();
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { rootMargin: '-80px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <div ref={sentinel} aria-hidden className="h-px" />
      <div className={`sticky top-16 z-20 -mx-4 mb-6 border-b bg-bg px-4 md:-mx-8 md:px-8 lg:top-[72px] xl:mx-0 xl:px-0 ${stuck ? 'border-line' : 'border-transparent'}`}>
        <div className="flex min-h-[60px] items-center gap-2 py-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            className="label flex h-11 flex-none items-center gap-2 border border-ink px-3.5 lg:hidden"
          >
            <FilterIcon />
            Filters
            {chips.length > 0 && <span className="flex h-5 min-w-5 items-center justify-center bg-accent px-1 text-[11px] text-[#F7F2EB]">{chips.length}</span>}
          </button>

          <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            {chips.map((c) => (
              <button
                key={c.key + c.value}
                type="button"
                onClick={() => remove(c.key, c.value)}
                aria-label={`Remove filter ${c.label}`}
                className="label-sm flex h-9 flex-none items-center gap-2.5 border border-ink px-3 hover:border-accent"
              >
                <span className="whitespace-nowrap">{c.label}</span>
                <span aria-hidden>×</span>
              </button>
            ))}
            {chips.length > 0 ? (
              <button type="button" onClick={clear} className="link flex-none whitespace-nowrap px-1">
                Clear all
              </button>
            ) : (
              <span className="label hidden text-muted lg:inline">{count}</span>
            )}
          </div>

          <span className="label hidden flex-none text-muted sm:inline lg:hidden" aria-live="polite">
            {pending ? 'Updating…' : count}
          </span>
          {chips.length > 0 && (
            <span className="label hidden flex-none text-muted lg:inline" aria-live="polite">
              {pending ? 'Updating…' : count}
            </span>
          )}
          <label htmlFor="sort" className="sr-only">
            Sort
          </label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)} className="label h-11 max-w-[44vw] flex-none border border-line bg-smoke px-2.5 text-ink sm:max-w-none">
            <option value="new">Newest</option>
            <option value="low">Price ↑</option>
            <option value="high">Price ↓</option>
          </select>
        </div>
        {/* thin loading line under the toolbar while results update */}
        <div className={`absolute inset-x-0 -bottom-px h-0.5 overflow-hidden ${pending ? 'opacity-100' : 'opacity-0'} transition-opacity`} aria-hidden>
          <div className="h-full w-1/3 animate-load bg-accent" />
        </div>
      </div>

      {open && (
        <Portal>
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-bg/70" onClick={() => setOpen(false)} />
          <div className="relative flex max-h-[85vh] flex-col border-t border-line bg-bg animate-rise">
            <div className="flex h-14 flex-none items-center justify-between border-b border-line px-4">
              <span className="label">Filters</span>
              <button type="button" aria-label="Close filters" autoFocus onClick={() => setOpen(false)} className="-mr-2.5 flex h-11 w-11 items-center justify-center">
                <CloseIcon />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
              <FilterPanel groups={groups} touch />
            </div>
            <div className="flex flex-none gap-2 border-t border-line px-4 py-3">
              <button type="button" onClick={clear} className="btn-secondary px-4">
                Clear
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn-primary flex-1">
                {pending ? 'Updating…' : `Show ${count}`}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </>
  );
}

/** Product grid wrapper: dims while new results load, and brings the top of the results into view after a change. */
export function ShopResults({ children }: { children: ReactNode }) {
  const { pending } = useContext(Ctx);
  const sp = useSearchParams();
  const ref = useRef<HTMLDivElement>(null);
  const key = (() => {
    const p = new URLSearchParams(sp.toString());
    p.delete('show');
    return p.toString();
  })();
  const firstKey = useRef(key);
  useEffect(() => {
    if (key === firstKey.current) return;
    firstKey.current = key;
    const el = ref.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [key]);
  return (
    <div ref={ref} aria-busy={pending} className={`flex min-w-0 flex-1 scroll-mt-[140px] flex-col gap-10 transition-opacity duration-200 ${pending ? 'opacity-50' : 'opacity-100'}`}>
      {children}
    </div>
  );
}
