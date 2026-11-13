import type { Metadata } from 'next';

/** Open Graph + Twitter metadata for a page, using the branded /og preview image. */
export function shareMeta(opts: { title: string; description: string; path: string; image: string; alt: string }): Metadata {
  const images = [{ url: opts.image, width: 1200, height: 630, alt: opts.alt, type: 'image/jpeg' }];
  return {
    openGraph: { title: opts.title, description: opts.description, url: opts.path, images },
    twitter: { card: 'summary_large_image', title: opts.title, description: opts.description, images: [opts.image] },
  };
}
