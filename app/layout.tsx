import type { Metadata, Viewport } from 'next';
import { Archivo, Bodoni_Moda, IBM_Plex_Mono, Inter } from 'next/font/google';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { BackToTop } from '@/components/BackToTop';
import { Header } from '@/components/Header';
import { NavProgress } from '@/components/NavProgress';
import { Toaster } from '@/components/Toaster';
import { getSettings } from '@/lib/catalog';
import { SITE_URL } from '@/lib/env';
import './globals.css';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter', display: 'swap' });
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' });
const bodoni = Bodoni_Moda({ subsets: ['latin'], style: ['italic'], weight: ['500'], variable: '--font-bodoni', display: 'swap', adjustFontFallback: false });
const plex = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex', display: 'swap' });

const DESCRIPTION = "Luxury menswear from Lagos. Shop the new drop, or send a pic and we'll make it in your size.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'HOLASKEY — Luxury menswear, Lagos', template: '%s · HOLASKEY' },
  description: DESCRIPTION,
  applicationName: 'HOLASKEY',
  openGraph: {
    siteName: 'HOLASKEY',
    type: 'website',
    locale: 'en_NG',
    url: '/',
    title: 'HOLASKEY — Luxury menswear, Lagos',
    description: DESCRIPTION,
    images: [{ url: '/og?p=home', width: 1200, height: 630, alt: 'HOLASKEY — Dressed for the moment.', type: 'image/jpeg' }],
  },
  twitter: { card: 'summary_large_image', title: 'HOLASKEY — Luxury menswear, Lagos', description: DESCRIPTION, images: ['/og?p=home'] },
  appleWebApp: { capable: true, title: 'HOLASKEY', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#120D0A',
  width: 'device-width',
  initialScale: 1,
};

// Sets the saved theme before first paint (dark is the default).
const themeScript = `document.documentElement.classList.add('js');try{var t=localStorage.getItem('hk-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <html
      lang="en-NG"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${archivo.variable} ${bodoni.variable} ${plex.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ClothingStore',
              name: 'HOLASKEY',
              url: SITE_URL,
              logo: `${SITE_URL}/icon-512.png`,
              image: `${SITE_URL}/img/hero.jpg`,
              address: { '@type': 'PostalAddress', addressLocality: 'Lagos', addressCountry: 'NG' },
              currenciesAccepted: 'NGN',
              sameAs: [settings.instagram].filter(Boolean),
            }),
          }}
        />
      </head>
      <body>
        <NavProgress />
        <a href="#main" className="label sr-only z-50 bg-ink p-3 text-bg focus:not-sr-only focus:fixed focus:left-2 focus:top-2">
          Skip to content
        </a>
        {settings.announcement && (
          <aside aria-label="Announcement">
          <Link
            href="/custom"
            className="label-sm flex h-8 items-center justify-center overflow-hidden whitespace-nowrap bg-espresso px-4 text-ink hover:text-ink"
          >
            {settings.announcement}
          </Link>
          </aside>
        )}
        <Header />
        <div id="main">{children}</div>
        <Footer />
        <BackToTop />
        <Toaster />
      </body>
    </html>
  );
}
