'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { SearchBox } from './SearchBox';
import { ThemeSwitch } from './ThemeToggle';
import { CloseIcon, MenuIcon, SearchIcon } from './icons';

type Match = (path: string, sp: URLSearchParams) => boolean;
const NAV: { href: string; label: string; match: Match }[] = [
  { href: '/shop', label: 'Shop', match: (p, sp) => (p.startsWith('/shop') && sp.get('new') !== '1') || p.startsWith('/product') },
  { href: '/shop?new=1', label: 'New In', match: (p, sp) => p.startsWith('/shop') && sp.get('new') === '1' },
  { href: '/custom', label: 'Custom', match: (p) => p.startsWith('/custom') },
  { href: '/lookbook', label: 'Lookbook', match: (p) => p.startsWith('/lookbook') },
];

function NavLinksInner() {
  const path = usePathname();
  const sp = useSearchParams();
  return (
    <nav aria-label="Main" className="hidden gap-8 lg:flex">
      {NAV.map((n) => {
        const on = n.match(path, sp);
        return (
          <Link
            key={n.label}
            href={n.href}
            aria-current={on ? 'page' : undefined}
            className={`label relative py-2 hover:no-underline ${on ? 'text-accent' : 'text-ink'} after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:bg-accent after:transition-transform after:duration-200 ${on ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'}`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function NavLinks() {
  return (
    <Suspense fallback={<nav aria-label="Main" className="hidden gap-8 lg:flex" />}>
      <NavLinksInner />
    </Suspense>
  );
}

export function SearchButton() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <>
      <button type="button" aria-label="Search" aria-expanded={open} onClick={() => setOpen(true)} className="flex h-11 w-11 items-center justify-center text-ink hover:text-accent">
        <SearchIcon />
      </button>
      {open && (
        <>
          <button type="button" aria-label="Close search" className="fixed inset-0 z-40 cursor-default bg-bg/60" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg animate-rise">
            <div className="wrap flex items-start gap-4 pt-3">
              <div className="mx-auto w-full max-w-[720px]">
                <SearchBox autoFocus onDone={() => setOpen(false)} />
              </div>
              <button type="button" aria-label="Close search" onClick={() => setOpen(false)} className="flex h-12 w-11 flex-none items-center justify-center">
                <CloseIcon />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function MobileMenuInner({ categories, signedIn, admin }: { categories: { name: string; slug: string }[]; signedIn: boolean; admin: boolean }) {
  const [open, setOpen] = useState(false);
  const [cats, setCats] = useState(false);
  const path = usePathname();
  const sp = useSearchParams();
  const close = () => setOpen(false);

  // Close whenever the URL changes at all (path or query), e.g. Shop → New In.
  useEffect(() => setOpen(false), [path, sp]);
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

  const item = (on: boolean) =>
    `flex min-h-16 w-full items-center justify-between border-b border-line font-display text-[28px] font-bold uppercase hover:no-underline ${on ? 'text-accent hover:text-accent' : 'text-ink hover:text-ink'}`;
  const links: [string, string, boolean][] = [
    ['/shop', 'Shop', NAV[0].match(path, sp)],
    ['/shop?new=1', 'New In', NAV[1].match(path, sp)],
  ];

  return (
    <>
      <button type="button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)} className="-ml-2.5 flex h-11 w-11 items-center justify-center text-ink">
        <MenuIcon />
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 flex flex-col bg-bg animate-rise">
          <div className="grid h-16 flex-none grid-cols-[1fr_auto_1fr] items-center border-b border-line px-4">
            <button type="button" aria-label="Close menu" onClick={close} autoFocus className="-ml-2.5 flex h-11 w-11 items-center justify-center text-ink">
              <CloseIcon size={24} />
            </button>
            <Link href="/" onClick={close} aria-label="HOLASKEY home">
              <Image src="/wordmark-bone.png" alt="HOLASKEY" width={352} height={44} className="logo h-auto w-[104px]" />
            </Link>
            <span />
          </div>
          <div className="flex-none border-b border-line px-4">
            <SearchBox onDone={close} />
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-4 pb-6">
            {links.map(([href, label, on]) => (
              <Link key={label} href={href} onClick={close} aria-current={on ? 'page' : undefined} className={item(on)}>
                {label}
              </Link>
            ))}
            <div className="border-b border-line">
              <button type="button" aria-expanded={cats} onClick={() => setCats(!cats)} className={item(false).replace('border-b border-line', '')}>
                <span>Categories</span>
                <span className="font-mono text-lg font-normal" aria-hidden>
                  {cats ? '−' : '+'}
                </span>
              </button>
              {cats && (
                <div className="grid grid-cols-2 gap-x-4 pb-4">
                  {categories.map((c) => {
                    const on = path.startsWith('/shop') && sp.get('cat') === c.slug;
                    return (
                      <Link key={c.slug} href={`/shop?cat=${c.slug}`} onClick={close} className={`label flex min-h-11 items-center ${on ? 'text-accent' : ''}`}>
                        {c.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            <Link href="/custom" onClick={close} className={`${item(path.startsWith('/custom'))} !text-accent`}>
              Custom
            </Link>
            <Link href="/lookbook" onClick={close} className={item(path.startsWith('/lookbook'))}>
              Lookbook
            </Link>
            <Link href={signedIn ? (admin ? '/admin' : '/account') : '/login'} onClick={close} className={item(path.startsWith('/account') || path.startsWith('/admin'))}>
              {signedIn ? (admin ? 'Admin' : 'Account') : 'Log in'}
            </Link>
            {signedIn && (
              <Link href="/account/wishlist" onClick={close} className={item(path.startsWith('/account/wishlist'))}>
                Wishlist
              </Link>
            )}
            <div className="flex items-center justify-between gap-4 pt-6">
              <span className="label text-muted">Theme</span>
              <ThemeSwitch />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

/** Full-screen dark menu: Shop, New In, Categories (expandable), Custom, Lookbook, Account. Archivo 28 px. */
export function MobileMenu(props: { categories: { name: string; slug: string }[]; signedIn: boolean; admin: boolean }) {
  return (
    <Suspense
      fallback={
        <span className="-ml-2.5 flex h-11 w-11 items-center justify-center text-ink">
          <MenuIcon />
        </span>
      }
    >
      <MobileMenuInner {...props} />
    </Suspense>
  );
}
