'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CloseIcon } from '@/components/icons';

export interface FilterGroup {
  key: string;
  title: string;
  full?: boolean;
  single?: boolean;
  opts: { value: string; label: string; hex?: string | null }[];
}

function useFilterNav() {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const values = (key: string) => (sp.get(key) ?? '').split(',').filter(Boolean);
  const toggle = (g: FilterGroup, value: string) => {
    const params = new URLSearchParams(sp.toString());
    params.delete('show');
    const cur = values(g.key);
    const nextVals = g.single ? (cur.includes(value) ? [] : [value]) : cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    if (nextVals.length) params.set(g.key, nextVals.join(','));
    else params.delete(g.key);
    router.replace(`${path}${params.size ? '?' + params : ''}`, { scroll: false });
  };
  return { values, toggle, clear: () => router.replace(path, { scroll: false }) };
}

export function FilterPanel({ groups, touch = false }: { groups: FilterGroup[]; touch?: boolean }) {
  const { values, toggle } = useFilterNav();
  return (
    <div className="flex flex-col gap-8">
      {groups.map((g) => {
        const on = values(g.key);
        return (
          <fieldset key={g.key} className="flex flex-col gap-3">
            <legend className="label mb-3 text-muted">{g.title}</legend>
            <div className="flex flex-wrap gap-1.5">
              {g.opts.map((o) => {
                const active = on.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(g, o.value)}
                    className={`chip ${touch ? 'min-h-11' : 'min-h-10'} ${g.full ? 'w-full justify-start text-left' : ''} ${active ? 'chip-on' : ''}`}
                  >
                    {o.hex !== undefined && (
                      <span className="h-3.5 w-3.5 flex-none border border-line" style={{ background: o.hex ?? 'transparent' }} aria-hidden />
                    )}
                    <span>{o.label}</span>
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

export function MobileFilters({ groups, count }: { groups: FilterGroup[]; count: string }) {
  const [open, setOpen] = useState(false);
  const { clear } = useFilterNav();
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);
  return (
    <div className="lg:hidden">
      <button type="button" onClick={() => setOpen(true)} className="label h-11 border border-ink px-4">
        Filters
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-bg/70" onClick={() => setOpen(false)} />
          <div className="relative flex max-h-[82vh] flex-col border-t border-line bg-bg animate-rise">
            <div className="flex h-14 items-center justify-between border-b border-line px-4">
              <span className="label">Filters</span>
              <button type="button" aria-label="Close filters" onClick={() => setOpen(false)} className="-mr-2.5 flex h-11 w-11 items-center justify-center">
                <CloseIcon />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5">
              <FilterPanel groups={groups} touch />
            </div>
            <div className="flex gap-2 border-t border-line px-4 py-3">
              <button type="button" onClick={clear} className="btn-secondary px-4">
                Clear
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn-primary flex-1">
                Show {count}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  return (
    <>
      <label htmlFor="sort" className="sr-only">
        Sort
      </label>
      <select
        id="sort"
        value={value}
        onChange={(e) => {
          const params = new URLSearchParams(sp.toString());
          if (e.target.value === 'new') params.delete('sort');
          else params.set('sort', e.target.value);
          router.replace(`${path}${params.size ? '?' + params : ''}`, { scroll: false });
        }}
        className="label h-11 border border-line bg-smoke px-3 text-ink"
      >
        <option value="new">Sort: Newest</option>
        <option value="low">Price: low to high</option>
        <option value="high">Price: high to low</option>
      </select>
    </>
  );
}
