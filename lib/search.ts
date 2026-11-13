import type { Product } from './types';

const stem = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/(es|s)$/, '');

/** Every word of the query must match the title, category, colours or description (plural-tolerant). */
export function searchProducts(all: Product[], q: string): Product[] {
  const words = q.split(/\s+/).map(stem).filter((w) => w.length > 1);
  if (!words.length) return all;
  const scored = all
    .map((p) => {
      const title = p.title.toLowerCase();
      const hay = `${p.title} ${p.category?.name ?? ''} ${p.category?.type ?? ''} ${p.variants.map((v) => v.colour).join(' ')} ${p.description}`.toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
      const tokens = hay.split(/\s+/).map(stem);
      let score = 0;
      for (const w of words) {
        const hit = tokens.some((t) => t.startsWith(w));
        if (!hit) return null;
        score += title.includes(w) ? 3 : 1;
      }
      return { p, score };
    })
    .filter(Boolean) as { p: Product; score: number }[];
  return scored.sort((a, b) => b.score - a.score).map((x) => x.p);
}
