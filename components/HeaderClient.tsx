'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CloseIcon, MenuIcon, SearchIcon } from './icons';

const NAV = [
  { href: '/shop', label: 'Shop', match: (p: string) => p.startsWith('/shop') || p.startsWith('/product') },
  { href: '/shop?new=1', label: 'New In', match: () => false },
  { href: '/custom', label: 'Custom', match: (p: string) => p.startsWith('/custom') },
  { href: '/lookbook', label: 'Lookbook', match: (p: string) => p.startsWith('/lookbook') },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="hidden gap-8 lg:flex">
      {NAV.map((n) => (
        <Link
          key={n.label}
          href={n.href}
          aria-current={n.match(path) ? 'page' : undefined}
          className={`label ${n.match(path) ? 'text-accent' : 'text-ink'}`}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  return (
    <>
      <button type="button" aria-label="Search" onClick={() => setOpen(true)} className="flex h-11 w-11 items-center justify-center text-ink hover:text-accent">
        <SearchIcon />
      </button>
      {open && (
        <div className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg animate-rise">
          <form
            role="search"
            className="wrap flex h-[72px] items-center gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setOpen(false);
              router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
            }}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          >
            <SearchIcon />
            <label htmlFor="site-search" className="sr-only">
              Search products
            </label>
            <input
              id="site-search"
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search shirts, loafers, denim…"
              className="h-12 flex-1 bg-transparent text-lg outline-none"
            />
            <button type="button" aria-label="Close search" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center">
              <CloseIcon />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

/** Full-screen dark menu: Shop, New In, Categories (expandable), Custom, Lookbook, Account. Archivo 28 px. */
export function MobileMenu({ categories, signedIn }: { categories: { name: string; slug: string }[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [cats, setCats] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const item = 'flex min-h-16 w-full items-center justify-between border-b border-line font-display text-[28px] font-bold uppercase text-ink hover:text-ink hover:no-underline';
  return (
    <>
      <button type="button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)} className="-ml-2.5 flex h-11 w-11 items-center justify-center text-ink">
        <MenuIcon />
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 flex flex-col bg-bg animate-rise">
          <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-line px-4">
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="-ml-2.5 flex h-11 w-11 items-center justify-center text-ink">
              <CloseIcon size={24} />
            </button>
            <Image src="/wordmark-bone.png" alt="HOLASKEY" width={352} height={44} className="logo h-auto w-[104px]" />
            <span />
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto p-4">
            <Link href="/shop" className={item}>
              Shop
            </Link>
            <Link href="/shop?new=1" className={item}>
              New In
            </Link>
            <div className="border-b border-line">
              <button type="button" aria-expanded={cats} onClick={() => setCats(!cats)} className={item.replace('border-b border-line', '')}>
                <span>Categories</span>
                <span className="font-mono text-lg font-normal">{cats ? '−' : '+'}</span>
              </button>
              {cats && (
                <div className="flex flex-col pb-4">
                  {categories.map((c) => (
                    <Link key={c.slug} href={`/shop?cat=${c.slug}`} className="label flex min-h-11 items-center">
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link href="/custom" className={`${item} !text-accent`}>
              Custom
            </Link>
            <Link href="/lookbook" className={item}>
              Lookbook
            </Link>
            <Link href={signedIn ? '/account' : '/login'} className={item}>
              {signedIn ? 'Account' : 'Log in'}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
