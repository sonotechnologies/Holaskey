import type { MetadataRoute } from 'next';

/** Lets customers add HOLASKEY to their phone's home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HOLASKEY',
    short_name: 'HOLASKEY',
    description: 'Luxury menswear from Lagos. Shop new in, or send the pic and we make it in your size.',
    start_url: '/',
    display: 'standalone',
    background_color: '#120D0A',
    theme_color: '#120D0A',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'New In', url: '/shop?new=1' },
      { name: 'Custom order', url: '/custom' },
      { name: 'My bag', url: '/cart' },
    ],
  };
}
