import type { Metadata, Viewport } from 'next';
import { Archivo, Bodoni_Moda, IBM_Plex_Mono, Inter } from 'next/font/google';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { getSettings } from '@/lib/catalog';
import { SITE_URL } from '@/lib/env';
import './globals.css';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter', display: 'swap' });
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' });
const bodoni = Bodoni_Moda({ subsets: ['latin'], style: ['italic'], weight: ['500'], variable: '--font-bodoni', display: 'swap', adjustFontFallback: false });
const plex = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'HOLASKEY — Luxury menswear, Lagos', template: '%s · HOLASKEY' },
  description:
    'Designer-level menswear for young Nigerian men: tailored shirts, premium tees, cargos, denim, jackets, sets, sneakers and loafers. Custom orders made to your size.',
  openGraph: { siteName: 'HOLASKEY', type: 'website', locale: 'en_NG', images: ['/img/hero.jpg'] },
  twitter: { card: 'summary_large_image' },
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
      </head>
      <body>
        <a href="#main" className="label sr-only z-50 bg-ink p-3 text-bg focus:not-sr-only focus:fixed focus:left-2 focus:top-2">
          Skip to content
        </a>
        {settings.announcement && (
          <Link
            href="/custom"
            className="label-sm flex h-8 items-center justify-center overflow-hidden whitespace-nowrap bg-espresso px-4 text-ink hover:text-ink"
          >
            {settings.announcement}
          </Link>
        )}
        <Header />
        <div id="main">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
