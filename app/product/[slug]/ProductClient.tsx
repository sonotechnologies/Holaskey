'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { addToCart, toggleWishlist, type AddResult } from '@/app/actions/shop';
import { CloseIcon, HeartIcon } from '@/components/icons';
import { Portal } from '@/components/Portal';
import { Img, PhotoPlaceholder } from '@/components/Img';
import { toast } from '@/components/Toaster';
import { naira } from '@/lib/format';
import type { Variant } from '@/lib/types';

// ---------------------------------------------------------------------------
// Gallery: swipe on phones (with dots), thumbnails on desktop, tap to open full screen.
// ---------------------------------------------------------------------------
export function Gallery({ images, shoe }: { images: { src: string; alt: string }[]; shoe: boolean }) {
  const [i, setI] = useState(0);
  const [zoomAt, setZoomAt] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const labels = shoe ? ['Front', 'Side', 'Detail', 'On foot'] : ['Front', 'Back', 'Detail', 'Worn'];

  // Keep the dot / thumbnail in sync with the swiped slide.
  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const n = Math.round(el.scrollLeft / el.clientWidth);
    if (n !== i) setI(n);
  };
  const goTo = (n: number) => {
    setI(n);
    const el = track.current;
    if (el) el.scrollTo({ left: n * el.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  if (!images.length)
    return (
      <div className="relative aspect-[4/5] bg-smoke">
        <PhotoPlaceholder />
      </div>
    );

  return (
    <div className="-mx-4 flex flex-col gap-3 md:mx-0">
      <div className="relative">
        <div
          ref={track}
          onScroll={onScroll}
          className="no-scrollbar flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto overscroll-x-contain bg-smoke"
          aria-roledescription="carousel"
          aria-label="Product photos"
        >
          {images.map((img, n) => (
            <button
              key={img.src + n}
              type="button"
              onClick={() => setZoomAt(n)}
              aria-label={`Open photo ${n + 1} of ${images.length} full screen`}
              className="relative h-full w-full flex-none snap-center cursor-zoom-in"
            >
              <Img src={img.src} alt={img.alt} fill priority={n === 0} sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            </button>
          ))}
        </div>
        {images.length > 1 && (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden" aria-hidden>
              {images.map((_, n) => (
                <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-5 bg-ink' : 'w-1.5 bg-ink/40'}`} />
              ))}
            </div>
            <span className="label-sm absolute right-3 top-3 bg-bg/70 px-2 py-1 md:hidden" aria-live="polite">
              {i + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="hidden grid-cols-4 gap-3 md:grid">
          {images.slice(0, 8).map((img, n) => (
            <button
              key={img.src + n}
              type="button"
              onClick={() => goTo(n)}
              aria-label={`Show photo ${n + 1}: ${labels[n] ?? img.alt}`}
              aria-pressed={n === i}
              className={`relative aspect-[4/5] overflow-hidden border bg-smoke transition-opacity ${n === i ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100'}`}
            >
              <Img src={img.src} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      {zoomAt !== null && (
        <Portal>
          <Lightbox images={images} start={zoomAt} onClose={(n) => (setZoomAt(null), goTo(n))} />
        </Portal>
      )}
    </div>
  );
}

/** Full-screen viewer: swipe or arrow keys between photos, tap/click to zoom in on a point. */
function Lightbox({ images, start, onClose }: { images: { src: string; alt: string }[]; start: number; onClose: (n: number) => void }) {
  const [n, setN] = useState(start);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const touchX = useRef<number | null>(null);
  const close = useCallback(() => onClose(n), [n, onClose]);
  const step = useCallback((d: number) => {
    setZoom(null);
    setN((x) => (x + d + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [close, step]);

  const img = images[n];
  return (
    <div role="dialog" aria-modal="true" aria-label="Product photos" className="fixed inset-0 z-[70] flex flex-col bg-bg animate-rise">
      <div className="flex h-14 flex-none items-center justify-between px-4">
        <span className="label text-muted">
          {n + 1} / {images.length}
        </span>
        <button type="button" aria-label="Close" autoFocus onClick={close} className="-mr-2.5 flex h-11 w-11 items-center justify-center">
          <CloseIcon size={24} />
        </button>
      </div>
      <div
        className="relative flex-1 overflow-hidden"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null || zoom) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        <button
          type="button"
          aria-label={zoom ? 'Zoom out' : 'Zoom in'}
          onClick={(e) => {
            if (zoom) return setZoom(null);
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseMove={(e) => {
            if (!zoom) return;
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          className={`absolute inset-0 ${zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={img.src}
            src={img.src}
            alt={img.alt}
            className="h-full w-full object-contain transition-transform duration-200"
            style={zoom ? { transform: 'scale(2.2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            draggable={false}
          />
        </button>
        {images.length > 1 && (
          <>
            <button type="button" aria-label="Previous photo" onClick={() => step(-1)} className="absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center border border-line bg-bg/80 md:flex">
              ←
            </button>
            <button type="button" aria-label="Next photo" onClick={() => step(1)} className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center border border-line bg-bg/80 md:flex">
              →
            </button>
          </>
        )}
      </div>
      <p className="label-sm flex-none py-3 text-center text-muted">{zoom ? 'Tap to zoom out' : 'Tap to zoom · swipe for more'}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Buy box
// ---------------------------------------------------------------------------
interface Props {
  productId: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
  variants: Variant[];
  wished: boolean;
  shoe: boolean;
  initialVariant?: string;
  whatsapp: string;
  accordions: { key: string; title: string; body: string }[];
}

export function ProductBuy({ productId, slug, title, price, image, variants, wished: initialWish, shoe, initialVariant, whatsapp, accordions }: Props) {
  const colours = useMemo(() => {
    const m = new Map<string, string | null>();
    variants.forEach((v) => m.set(v.colour, v.colour_hex));
    return Array.from(m, ([name, hex]) => ({ name, hex }));
  }, [variants]);
  const preset = variants.find((v) => v.id === initialVariant && v.stock > 0);
  const [colour, setColour] = useState(preset?.colour ?? colours[0]?.name ?? '');
  const sizes = useMemo(() => {
    const order = shoe ? null : ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    const list = variants.filter((v) => v.colour === colour);
    return order ? [...list].sort((a, b) => order.indexOf(a.size) - order.indexOf(b.size)) : [...list].sort((a, b) => a.size.localeCompare(b.size, undefined, { numeric: true }));
  }, [variants, colour, shoe]);
  const [variantId, setVariantId] = useState<string | null>(preset?.id ?? null);
  const selected = sizes.find((v) => v.id === variantId) ?? null;
  const [state, action] = useFormState<AddResult, FormData>(addToCart, null);
  const [drawer, setDrawer] = useState(false);
  const [open, setOpen] = useState<string | null>('desc');
  const [wished, setWished] = useState(initialWish);
  const [wishPending, startWish] = useTransition();
  const [nudge, setNudge] = useState(false);
  const path = usePathname();
  const allSold = variants.length > 0 && variants.every((v) => v.stock < 1);

  // A successful add opens the mini bag.
  useEffect(() => {
    if (state?.ok) setDrawer(true);
    else if (state && !state.ok) toast({ message: state.error, tone: 'error' });
  }, [state]);

  const askSize = () => {
    setNudge(true);
    document.getElementById('size-picker')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    window.setTimeout(() => setNudge(false), 1200);
  };
  const waText = `Hi HOLASKEY, I'm interested in the ${title}${selected ? ` (size ${selected.size}, ${selected.colour})` : ''}. ${typeof window !== 'undefined' ? window.location.origin : ''}/product/${slug}`;

  return (
    <>
      {colours.length > 0 && (
        <fieldset className="flex flex-col">
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
                  const same = variants.find((v) => v.colour === c.name && v.size === selected?.size && v.stock > 0);
                  setVariantId(same?.id ?? null);
                }}
                className={`h-11 w-11 border p-1 ${c.name === colour ? 'border-ink' : 'border-transparent hover:border-line'}`}
              >
                <span className="block h-full w-full border border-line" style={{ background: c.hex ?? 'rgb(var(--hk-s2))' }} />
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset id="size-picker" className={`flex scroll-mt-32 flex-col transition-transform ${nudge ? 'animate-[nudge_.4s_ease-in-out_2]' : ''}`}>
        <div className="mb-3 flex items-baseline justify-between">
          <legend className="label">
            Size{selected && <span className="text-muted"> — {selected.size}</span>}
          </legend>
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
                className={`relative h-12 border font-mono text-[13px] font-medium transition-colors ${
                  on ? 'border-ink bg-ink text-bg' : sold ? 'cursor-not-allowed border-line text-muted line-through' : 'border-line text-ink hover:border-ink'
                }`}
              >
                {v.size}
                {!sold && v.stock <= 2 && <span className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${on ? 'bg-bg' : 'bg-accent'}`} aria-hidden />}
              </button>
            );
          })}
        </div>
        <p className={`mt-2 min-h-5 text-sm ${nudge ? 'text-accent' : 'text-muted'}`}>
          {selected ? (selected.stock <= 2 ? `Only ${selected.stock} left in ${selected.size}.` : 'In stock. Ships in 1–2 days in Lagos.') : allSold ? 'Sold out in every size.' : 'Choose a size.'}
        </p>
      </fieldset>

      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="variant_id" value={selected?.id ?? ''} />
        <input type="hidden" name="next" value={`/product/${slug}${selected ? `?v=${selected.id}` : ''}`} />
        <div className="flex gap-2">
          <AddButton selected={!!selected} allSold={allSold} onNeedSize={askSize} />
          <button
            type="button"
            aria-label={wished ? `Remove ${title} from wishlist` : `Add ${title} to wishlist`}
            aria-pressed={wished}
            disabled={wishPending}
            onClick={() =>
              startWish(async () => {
                const r = await toggleWishlist(productId, path);
                if ('wished' in r) {
                  setWished(r.wished);
                  toast(r.wished ? { message: 'Saved to your wishlist', action: { label: 'View', href: '/account/wishlist' } } : 'Removed from your wishlist');
                } else toast({ message: r.error, tone: 'error' });
              })
            }
            className={`flex h-12 w-12 flex-none items-center justify-center border border-ink transition-colors ${wished ? 'text-accent' : 'text-ink'}`}
          >
            <HeartIcon filled={wished} />
          </button>
        </div>
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="label inline-flex items-center gap-2 self-start py-2 underline underline-offset-4"
          >
            Ask about this on WhatsApp
          </a>
        )}

        {/* Mobile: sticky add-to-bag bar with selected size and price */}
        <div className="sticky-buy fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-line bg-bg px-4 py-3 lg:hidden">
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="label-sm text-muted">{selected ? `Size ${selected.size}` : 'Select a size'}</span>
            <span className="font-semibold">{naira(price)}</span>
          </div>
          <AddButton selected={!!selected} allSold={allSold} onNeedSize={askSize} />
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

      {drawer && state?.ok && selected && (
        <Portal>
          <BagDrawer onClose={() => setDrawer(false)} item={{ title, size: selected.size, colour: selected.colour, price, image }} bag={state.bag} />
        </Portal>
      )}
    </>
  );
}

/** Never disabled for "no size yet": tapping it points the customer at the size chips instead. */
function AddButton({ selected, allSold, onNeedSize }: { selected: boolean; allSold: boolean; onNeedSize: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button
      type={selected ? 'submit' : 'button'}
      onClick={selected ? undefined : onNeedSize}
      disabled={pending || allSold}
      className="btn-primary flex-1"
    >
      {allSold ? 'Sold out' : pending ? 'Adding…' : selected ? 'Add to bag' : 'Select a size'}
    </button>
  );
}

/** Mini bag: slides in from the right (bottom sheet on phones) after adding. */
function BagDrawer({
  onClose,
  item,
  bag,
}: {
  onClose: () => void;
  item: { title: string; size: string; colour: string; price: number; image: string | null };
  bag?: { count: number; subtotal: number };
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[65]" role="dialog" aria-modal="true" aria-label="Added to bag">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-bg/60" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 border-t border-line bg-bg p-5 animate-rise md:inset-y-0 md:left-auto md:w-[400px] md:border-l md:border-t-0 md:p-7">
        <div className="flex items-center justify-between">
          <span className="label flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
            Added to bag
          </span>
          <button type="button" aria-label="Close" autoFocus onClick={onClose} className="-mr-2.5 flex h-11 w-11 items-center justify-center">
            <CloseIcon />
          </button>
        </div>
        <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-4">
          <div className="relative aspect-[4/5] bg-smoke">{item.image && <Img src={item.image} alt="" fill sizes="72px" className="object-cover" />}</div>
          <div className="flex flex-col gap-1">
            <span className="font-medium">{item.title}</span>
            <span className="text-sm text-muted">
              Size {item.size} · {item.colour}
            </span>
            <span className="font-semibold">{naira(item.price)}</span>
          </div>
        </div>
        {bag && (
          <div className="flex justify-between border-t border-line pt-4 text-[15px]">
            <span>
              Bag · {bag.count} {bag.count === 1 ? 'item' : 'items'}
            </span>
            <span className="font-semibold">{naira(bag.subtotal)}</span>
          </div>
        )}
        <div className="flex flex-col gap-2 md:mt-auto">
          <Link href="/checkout" className="btn-primary">
            Checkout
          </Link>
          <Link href="/cart" className="btn-secondary">
            View bag
          </Link>
          <button type="button" onClick={onClose} className="link self-center py-2">
            Continue shopping
          </button>
        </div>
      </div>
    </div>
  );
}
