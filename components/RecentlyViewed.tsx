'use client';
import { useEffect, useState } from 'react';
import { ProductCard, type CardProduct } from './ProductCard';

const KEY = 'hk-recent';

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

/** Remembers this product as recently viewed (on this device only). */
export function RecordView({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify([slug, ...read().filter((s) => s !== slug)].slice(0, 12)));
    } catch {}
  }, [slug]);
  return null;
}

/** "Recently viewed" rail; renders nothing until there is something to show. */
export function RecentlyViewed({ exclude, title = 'Recently viewed', className = '' }: { exclude?: string; title?: string; className?: string }) {
  const [cards, setCards] = useState<CardProduct[]>([]);
  useEffect(() => {
    const slugs = read().filter((s) => s !== exclude).slice(0, 8);
    if (!slugs.length) return;
    fetch(`/api/cards?slugs=${slugs.map(encodeURIComponent).join(',')}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setCards)
      .catch(() => {});
  }, [exclude]);
  if (!cards.length) return null;
  return (
    <section className={`animate-rise ${className}`} aria-label={title}>
      <h2 className="h2 mb-6">{title}</h2>
      <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 md:mx-0 md:px-0 lg:gap-6">
        {cards.map((c) => (
          <div key={c.id} className="w-[44vw] max-w-[260px] flex-none snap-start md:w-[22%]">
            <ProductCard p={c} sizes="260px" />
          </div>
        ))}
      </div>
    </section>
  );
}
