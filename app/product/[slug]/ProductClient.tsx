'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { addToCart, toggleWishlist } from '@/app/actions/shop';
import { HeartIcon } from '@/components/icons';
import { Img, PhotoPlaceholder } from '@/components/Img';
import { naira } from '@/lib/format';
import type { ActionResult, Variant } from '@/lib/types';

export function Gallery({ images, shoe }: { images: { src: string; alt: string }[]; shoe: boolean }) {
  const [i, setI] = useState(0);
  const labels = shoe ? ['Front', 'Side', 'Detail', 'On foot'] : ['Front', 'Back', 'Detail', 'Worn'];
  const cur = images[i];
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden bg-smoke">
        {cur ? <Img key={cur.src + i} src={cur.src} alt={cur.alt} fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" /> : <PhotoPlaceholder />}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.slice(0, 8).map((img, n) => (
            <button
              key={img.src + n}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Show photo ${n + 1}: ${labels[n] ?? img.alt}`}
              aria-pressed={n === i}
              className={`relative aspect-[4/5] overflow-hidden border bg-smoke ${n === i ? 'border-ink' : 'border-transparent'}`}
            >
              <Img src={img.src} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  productId: string;
  slug: string;
  title: string;
  price: number;
  variants: Variant[];
  wished: boolean;
  shoe: boolean;
  accordions: { key: string; title: string; body: string }[];
}

export function ProductBuy({ productId, slug, title, price, variants, wished: initialWish, shoe, accordions }: Props) {
  const colours = useMemo(() => {
    const m = new Map<string, string | null>();
    variants.forEach((v) => m.set(v.colour, v.colour_hex));
    return Array.from(m, ([name, hex]) => ({ name, hex }));
  }, [variants]);
  const [colour, setColour] = useState(colours[0]?.name ?? '');
  const sizes = useMemo(() => {
    const order = shoe ? null : ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    const list = variants.filter((v) => v.colour === colour);
    return order ? [...list].sort((a, b) => order.indexOf(a.size) - order.indexOf(b.size)) : [...list].sort((a, b) => a.size.localeCompare(b.size, undefined, { numeric: true }));
  }, [variants, colour, shoe]);
  const [variantId, setVariantId] = useState<string | null>(null);
  const selected = sizes.find((v) => v.id === variantId) ?? null;
  const [state, action] = useFormState<ActionResult | null, FormData>(addToCart, null);
  const [open, setOpen] = useState<string | null>('desc');
  const [wished, setWished] = useState(initialWish);
  const [wishPending, startWish] = useTransition();
  const path = usePathname();
  const allSold = variants.every((v) => v.stock < 1);

  const addLabel = allSold ? 'Sold out' : 'Add to bag';

  return (
    <>
      {colours.length > 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="label mb-3">
            Colour — <span className="text-muted">{colour}</span>
          </legend>
          <div className="flex gap-3">
            {colours.map((c) => (
              <button
                key={c.name}
                type="button"
                aria-label={c.name}
                aria-pressed={c.name === colour}
                onClick={() => {
                  setColour(c.name);
                  setVariantId(null);
                }}
                className={`h-11 w-11 border p-1 ${c.name === colour ? 'border-ink' : 'border-transparent'}`}
              >
                <span className="block h-full w-full border border-line" style={{ background: c.hex ?? 'rgb(var(--hk-s2))' }} />
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <legend className="label">Size</legend>
          <Link href="/size-guide" className="link">
            Size guide
          </Link>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {sizes.map((v) => {
            const sold = v.stock < 1;
            const on = v.id === variantId;
            return (
              <button
                key={v.id}
                type="button"
                disabled={sold}
                aria-pressed={on}
                aria-label={sold ? `${v.size}, sold out` : v.stock <= 2 ? `${v.size}, only ${v.stock} left` : v.size}
                onClick={() => setVariantId(v.id)}
                className={`h-12 border font-mono text-[13px] font-medium ${
                  on ? 'border-ink bg-ink text-bg' : sold ? 'cursor-not-allowed border-line text-muted line-through' : 'border-line text-ink hover:border-ink'
                }`}
              >
                {v.size}
              </button>
            );
          })}
        </div>
        {selected && selected.stock <= 2 && <p className="text-sm text-muted">Only {selected.stock} left in this size.</p>}
      </fieldset>

      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="variant_id" value={selected?.id ?? ''} />
        <input type="hidden" name="next" value={`/product/${slug}`} />
        <div className="flex gap-2">
          <AddButton disabled={!selected || allSold} label={addLabel} />
          <button
            type="button"
            aria-label={wished ? `Remove ${title} from wishlist` : `Add ${title} to wishlist`}
            aria-pressed={wished}
            disabled={wishPending}
            onClick={() =>
              startWish(async () => {
                const r = await toggleWishlist(productId, path);
                if ('wished' in r) setWished(r.wished);
              })
            }
            className={`flex h-12 w-12 flex-none items-center justify-center border border-ink ${wished ? 'text-accent' : 'text-ink'}`}
          >
            <HeartIcon filled={wished} />
          </button>
        </div>
        {!selected && !allSold && <p className="text-sm text-muted">Choose a size to add this to your bag.</p>}
        {state && !state.ok && (
          <p role="alert" className="flex items-baseline gap-2 text-sm">
            <span className="label text-err">Error</span>
            {state.error}
          </p>
        )}
        {state?.ok && (
          <p role="status" className="text-sm">
            Added to bag.{' '}
            <Link href="/cart" className="link">
              View bag
            </Link>
          </p>
        )}

        {/* Mobile: sticky add-to-bag bar with selected size and price */}
        <div className="sticky-buy fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-line bg-bg px-4 py-3 lg:hidden">
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="label-sm text-muted">{selected ? `Size ${selected.size}` : 'Select a size'}</span>
            <span className="font-semibold">{naira(price)}</span>
          </div>
          <AddButton disabled={!selected || allSold} label={addLabel} />
        </div>
      </form>

      <div className="border-t border-line">
        {accordions.map((a) => (
          <div key={a.key} className="border-b border-line">
            <button
              type="button"
              aria-expanded={open === a.key}
              aria-controls={`acc-${a.key}`}
              onClick={() => setOpen(open === a.key ? null : a.key)}
              className="label flex min-h-14 w-full items-center justify-between text-left"
            >
              <span>{a.title}</span>
              <span className="text-lg" aria-hidden>
                {open === a.key ? '−' : '+'}
              </span>
            </button>
            {open === a.key && (
              <p id={`acc-${a.key}`} className="mb-5 max-w-[52ch] text-[15px] text-muted">
                {a.body}
              </p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function AddButton({ disabled, label }: { disabled: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className="btn-primary flex-1">
      {pending ? 'Adding…' : label}
    </button>
  );
}
