'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toggleWishlist } from '@/app/actions/shop';
import { naira } from '@/lib/format';
import { productImageUrl } from '@/lib/images';
import { HeartIcon } from './icons';
import { Img, PhotoPlaceholder } from './Img';
import { toast } from './Toaster';

export interface CardProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  category: string;
  isNew: boolean;
  soldOut: boolean;
  img: string | null;
  img2: string | null;
  alt: string;
  alt2: string;
  wished: boolean;
}

export function ProductCard({ p, sizes = '(max-width: 768px) 50vw, 25vw', priority = false }: { p: CardProduct; sizes?: string; priority?: boolean }) {
  const [wished, setWished] = useState(p.wished);
  const [pending, start] = useTransition();
  const path = usePathname();
  const img = productImageUrl(p.img);
  const img2 = productImageUrl(p.img2);

  return (
    <div className="group relative flex flex-col gap-3">
      <Link href={`/product/${p.slug}`} className="flex flex-col gap-3 text-ink hover:text-ink hover:no-underline">
        <div className="relative aspect-[4/5] overflow-hidden bg-smoke">
          {img ? (
            <Img src={img} alt={p.alt} fill sizes={sizes} priority={priority} className="object-cover" />
          ) : (
            <PhotoPlaceholder />
          )}
          {img2 && (
            <Img
              src={img2}
              alt={p.alt2}
              fill
              sizes={sizes}
              className="object-cover !opacity-0 transition-opacity duration-[250ms] group-hover:!opacity-100"
            />
          )}
          {p.isNew && !p.soldOut && <span className="label-sm absolute left-3 top-3 text-accent">New</span>}
          {p.soldOut && (
            <span className="label-sm absolute inset-x-0 bottom-0 bg-bg/85 p-2.5 text-center">Sold out</span>
          )}
        </div>
        <div className="flex flex-col gap-0.5 leading-snug">
          <span className="label-sm text-muted">{p.category}</span>
          <span className="text-[15px] font-medium md:text-base">{p.title}</span>
          <span className="font-semibold">{naira(p.price)}</span>
        </div>
      </Link>
      <button
        type="button"
        aria-label={wished ? `Remove ${p.title} from wishlist` : `Add ${p.title} to wishlist`}
        aria-pressed={wished}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await toggleWishlist(p.id, path);
            if ('wished' in r) {
              setWished(r.wished);
              toast(r.wished ? { message: `${p.title} saved to your wishlist`, action: { label: 'View', href: '/account/wishlist' } } : `${p.title} removed from your wishlist`);
            } else toast({ message: r.error, tone: 'error' });
          })
        }
        className={`absolute right-0.5 top-0.5 flex h-11 w-11 items-center justify-center ${wished ? 'text-accent' : 'text-ink'}`}
      >
        <HeartIcon filled={wished} />
      </button>
    </div>
  );
}
