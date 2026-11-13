import { readFile } from 'node:fs/promises';
import path from 'node:path';
/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text -- satori renders plain <img> into the preview image */
import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import { getProduct } from '@/lib/catalog';
import { naira } from '@/lib/format';
import { productImageUrl } from '@/lib/images';

export const runtime = 'nodejs';

const W = 1200;
const H = 630;
const ONYX = '#120D0A';
const BONE = '#F3ECE2';
const ASH = '#B3A698';
const TERRA = '#C8744C';

const root = process.cwd();
const fontFile = (f: string) => readFile(path.join(root, 'lib/og-fonts', f));
const publicFile = (p: string) => readFile(path.join(root, 'public', p.replace(/^\//, '')));

/** Loads a local (/img/...) or remote photo and returns a resized JPEG data URI. */
async function photo(src: string, w: number, h: number, position = 'attention') {
  const buf = src.startsWith('/') ? await publicFile(src) : Buffer.from(await (await fetch(src)).arrayBuffer());
  const out = await sharp(buf).resize(w, h, { fit: 'cover', position }).jpeg({ quality: 82 }).toBuffer();
  return `data:image/jpeg;base64,${out.toString('base64')}`;
}
const png = async (p: string) => `data:image/png;base64,${(await publicFile(p)).toString('base64')}`;

const mono = { fontFamily: 'Plex', fontSize: 20, letterSpacing: 3, textTransform: 'uppercase' as const };

type Page = 'home' | 'shop' | 'custom' | 'lookbook' | 'product' | 'size-guide';

const COPY: Record<Exclude<Page, 'product'>, { kicker: string; title: string; accent: string; img: string }> = {
  home: { kicker: 'Luxury menswear · Lagos', title: 'Dressed for the moment.', accent: 'the new season', img: '/img/hero.jpg' },
  shop: { kicker: 'Shirts · Denim · Sneakers', title: 'Shop the drop.', accent: 'cut in Lagos', img: '/img/hk-935966.jpg' },
  custom: { kicker: 'Custom orders', title: "Send the pic. We'll make it.", accent: 'in your size', img: '/img/hk-7562644.jpg' },
  lookbook: { kicker: 'Lookbook · Season 04', title: 'The looks.', accent: 'after dark', img: '/img/hk-19168186.jpg' },
  'size-guide': { kicker: 'Size guide', title: 'Find your fit.', accent: 'or have it made', img: '/img/hk-6311503.jpg' },
};

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const page = (sp.get('p') ?? 'home') as Page;

  const [archivo, bodoni, plex, inter, wordmark, signature] = await Promise.all([
    fontFile('archivo-narrow-latin-700-normal.woff'),
    fontFile('bodoni-moda-latin-500-italic.woff'),
    fontFile('ibm-plex-mono-latin-500-normal.woff'),
    fontFile('Inter-Medium.otf'), // full Inter: includes the naira sign ₦
    png('/wordmark-bone.png'),
    png('/signature.png'),
  ]);

  let body: JSX.Element;

  if (page === 'product') {
    const p = await getProduct(sp.get('slug') ?? '');
    if (!p) return new Response('Not found', { status: 404 });
    const src = productImageUrl(p.images[0]?.path);
    const img = src ? await photo(src, 560, H) : null;
    const colours = Array.from(new Set(p.variants.map((v) => v.colour)));
    body = (
      <div style={{ display: 'flex', width: W, height: H, background: ONYX }}>
        <div style={{ display: 'flex', width: 560, height: H, background: '#1E1814' }}>
          {img && <img src={img} width={560} height={H} alt="" />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, padding: '56px 56px 48px' }}>
          <img src={wordmark} width={176} height={22} alt="" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', gap: 18, ...mono, color: ASH }}>
              <span>{p.category?.name ?? 'HOLASKEY'}</span>
              {p.is_new && <span style={{ color: TERRA }}>New in</span>}
            </div>
            <div style={{ fontFamily: 'Archivo', fontSize: p.title.length > 22 ? 64 : 76, lineHeight: 0.95, textTransform: 'uppercase', color: BONE }}>{p.title}</div>
            <div style={{ fontFamily: 'Inter', fontSize: 40, color: BONE }}>{naira(p.price)}</div>
            {colours.length > 0 && <div style={{ ...mono, fontSize: 18, color: ASH }}>{colours.join(' · ')}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ ...mono, fontSize: 17, color: ASH }}>Made to measure available</div>
            <img src={signature} width={96} height={57} alt="" />
          </div>
        </div>
      </div>
    );
  } else {
    const c = COPY[page] ?? COPY.home;
    const PHOTO_W = 500;
    const bg = await photo(c.img, PHOTO_W, H, page === 'home' ? 'centre' : 'attention');
    body = (
      <div style={{ display: 'flex', width: W, height: H, background: ONYX }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: W - PHOTO_W, height: H, padding: '56px 56px 48px 64px' }}>
          <img src={wordmark} width={192} height={24} alt="" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontFamily: 'Bodoni', fontSize: 40, color: BONE }}>{c.accent}</div>
            <div style={{ fontFamily: 'Archivo', fontSize: c.title.length > 22 ? 84 : 96, lineHeight: 0.92, textTransform: 'uppercase', color: BONE }}>{c.title}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ ...mono, fontSize: 18, color: ASH }}>{c.kicker}</div>
            <img src={signature} width={96} height={57} alt="" />
          </div>
        </div>
        <div style={{ display: 'flex', width: PHOTO_W, height: H, background: '#1E1814' }}>
          <img src={bg} width={PHOTO_W} height={H} alt="" />
        </div>
      </div>
    );
  }

  const rendered = new ImageResponse(body, {
    width: W,
    height: H,
    fonts: [
      { name: 'Archivo', data: archivo, weight: 700, style: 'normal' },
      { name: 'Bodoni', data: bodoni, weight: 500, style: 'italic' },
      { name: 'Plex', data: plex, weight: 500, style: 'normal' },
      { name: 'Inter', data: inter, weight: 500, style: 'normal' },
    ],
  });
  // WhatsApp and others want a small JPEG, not a large PNG.
  const jpeg = await sharp(Buffer.from(await rendered.arrayBuffer())).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
