import Image from 'next/image';
import Link from 'next/link';
import { getViewer } from '@/lib/auth';
import { getCartCount } from '@/lib/cards';
import { getCategories } from '@/lib/catalog';
import { BagIcon, HeartIcon, UserIcon } from './icons';
import { MobileMenu, NavLinks, SearchButton } from './HeaderClient';

/** 72 px desktop / 64 px mobile, logo small and centred, 1 px rule at the bottom. */
export async function Header() {
  const [viewer, count, categories] = await Promise.all([getViewer(), getCartCount(), getCategories()]);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg">
      <div className="wrap grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:h-[72px]">
        <div className="flex items-center">
          <div className="lg:hidden">
            <MobileMenu categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} signedIn={!!viewer} />
          </div>
          <NavLinks />
        </div>
        <Link href="/" aria-label="HOLASKEY home" className="flex justify-center px-4">
          <Image
            src="/wordmark-bone.png"
            alt="HOLASKEY"
            width={352}
            height={44}
            priority
            className="logo block h-auto w-[104px] lg:w-[140px]"
          />
        </Link>
        <div className="-mr-2.5 flex items-center justify-end gap-1">
          <div className="hidden items-center gap-1 lg:flex">
            <SearchButton />
            <Link href="/account/wishlist" aria-label="Wishlist" className="flex h-11 w-11 items-center justify-center text-ink hover:text-accent">
              <HeartIcon />
            </Link>
            <Link
              href={viewer ? (viewer.role === 'admin' ? '/admin' : '/account') : '/login'}
              aria-label={viewer ? 'Account' : 'Log in'}
              className="flex h-11 w-11 items-center justify-center text-ink hover:text-accent"
            >
              <UserIcon />
            </Link>
          </div>
          <Link
            href="/cart"
            aria-label={`Bag, ${count} ${count === 1 ? 'item' : 'items'}`}
            className="flex h-11 min-w-[44px] items-center justify-center gap-1.5 font-mono text-xs font-medium text-ink hover:text-accent hover:no-underline"
          >
            <BagIcon />
            <span>{count}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
