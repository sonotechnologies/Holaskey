'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  ['/admin', 'Dashboard'],
  ['/admin/orders', 'Orders'],
  ['/admin/custom', 'Custom'],
  ['/admin/products', 'Products'],
  ['/admin/categories', 'Categories'],
  ['/admin/customers', 'Customers'],
  ['/admin/settings', 'Settings'],
] as const;

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="no-scrollbar -mx-4 mb-6 flex gap-5 overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0 lg:mb-8 lg:gap-8">
      {LINKS.map(([href, label]) => {
        const on = href === '/admin' ? path === '/admin' : path.startsWith(href);
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
