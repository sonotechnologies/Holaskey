import type { MetadataRoute } from 'next';
import { getCategories, getProducts } from '@/lib/catalog';
import { SITE_URL } from '@/lib/env';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const pages = ['', '/shop', '/custom', '/lookbook', '/size-guide', '/about', '/contact', '/faq', '/policies/delivery', '/policies/returns', '/policies/privacy', '/policies/terms'];
  return [
    ...pages.map((p) => ({ url: SITE_URL + p, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.6 })),
    ...categories.map((c) => ({ url: `${SITE_URL}/shop?cat=${c.slug}`, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${SITE_URL}/product/${p.slug}`, lastModified: p.created_at, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ];
}
