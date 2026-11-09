'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  ['/account/orders', 'Orders'],
  ['/account/custom', 'Custom orders'],
  ['/account/measurements', 'Measurements'],
  ['/account/wishlist', 'Wishlist'],
  ['/account/addresses', 'Addresses'],
  ['/account', 'Profile'],
] as const;

export function AccountTabs() {
  const path = usePathname();
  return (
    <nav aria-label="Account" className="no-scrollbar mb-8 flex gap-5 overflow-x-auto border-b border-line lg:gap-10">
      {TABS.map(([href, label]) => {
        const on = href === '/account' ? path === '/account' : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? 'page' : undefined}
            className={`label -mb-px flex min-h-12 flex-none items-center whitespace-nowrap border-b-2 hover:no-underline ${on ? 'border-accent text-ink hover:text-ink' : 'border-transparent text-muted'}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
