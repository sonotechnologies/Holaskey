// Sample catalogue used when Supabase is not configured yet (local preview, first deploy).
// The same products are inserted by supabase/seed.sql.
import type { Category, Product } from './types';

export const DEMO_CATEGORIES: Category[] = [
  { id: 'c-shirts', type: 'clothing', name: 'Shirts', slug: 'shirts', sort: 1, image_path: '/img/hk-935966.jpg' },
  { id: 'c-tees', type: 'clothing', name: 'Tees & Polos', slug: 'tees-polos', sort: 2, image_path: '/img/hk-6311503.jpg' },
  { id: 'c-trousers', type: 'clothing', name: 'Trousers & Cargos', slug: 'trousers-cargos', sort: 3, image_path: '/img/hk-6311231.jpg' },
  { id: 'c-denim', type: 'clothing', name: 'Denim', slug: 'denim', sort: 4, image_path: '/img/hk-8505241.jpg' },
  { id: 'c-jackets', type: 'clothing', name: 'Jackets', slug: 'jackets', sort: 5, image_path: '/img/hk-19168186.jpg' },
  { id: 'c-sets', type: 'clothing', name: 'Two-Piece Sets', slug: 'two-piece-sets', sort: 6, image_path: '/img/hk-7562644.jpg' },
  { id: 'c-sneakers', type: 'shoes', name: 'Sneakers', slug: 'sneakers', sort: 7, image_path: '/img/hk-12628400.jpg' },
  { id: 'c-loafers', type: 'shoes', name: 'Loafers & Slides', slug: 'loafers-slides', sort: 8, image_path: '/img/hk-935966.jpg' },
];

const COLOURS: Record<string, string> = { Onyx: '#0B0907', Bone: '#F3ECE2', Espresso: '#5A3B28' };
const CLOTH_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['40', '41', '42', '43', '44', '45'];

type Seed = [slug: string, title: string, cat: string, naira: number, colours: string[], imgs: number[], opts?: { isNew?: boolean; soldOut?: boolean; featured?: boolean }];

const SEED: Seed[] = [
  ['boxy-oxford-shirt', 'Boxy Oxford Shirt', 'c-shirts', 145000, ['Bone', 'Onyx'], [935966, 8505241], { isNew: true, featured: true }],
  ['heavyweight-logo-tee', 'Heavyweight Logo Tee', 'c-tees', 65000, ['Bone', 'Onyx', 'Espresso'], [6311503, 6311231], { isNew: true }],
  ['parachute-cargo', 'Parachute Cargo', 'c-trousers', 120000, ['Espresso', 'Onyx'], [6311231, 8505241]],
  ['leather-bomber', 'Leather Bomber', 'c-jackets', 420000, ['Onyx', 'Espresso'], [19168186, 7562644], { isNew: true, featured: true }],
  ['washed-straight-denim', 'Washed Straight Denim', 'c-denim', 135000, ['Onyx'], [8505241, 935966]],
  ['knit-polo-set', 'Knit Polo Set', 'c-sets', 230000, ['Espresso', 'Bone'], [7562644, 6311503], { soldOut: true }],
  ['court-leather-sneaker', 'Court Leather Sneaker', 'c-sneakers', 260000, ['Bone'], [12628400, 8505241], { isNew: true, featured: true }],
  ['suede-penny-loafer', 'Suede Penny Loafer', 'c-loafers', 240000, ['Espresso', 'Onyx'], [935966, 7562644]],
  ['linen-camp-collar-shirt', 'Linen Camp Collar Shirt', 'c-shirts', 125000, ['Bone', 'Espresso'], [6311503, 935966]],
  ['nylon-overshirt', 'Nylon Overshirt', 'c-jackets', 210000, ['Onyx'], [19168186, 6311231]],
  ['knit-zip-polo', 'Knit Zip Polo', 'c-tees', 95000, ['Espresso', 'Bone'], [6311231, 6311503], { isNew: true }],
  ['black-selvedge-jean', 'Black Selvedge Jean', 'c-denim', 165000, ['Onyx'], [8505241, 19168186]],
];

function describe(title: string, shoe: boolean) {
  return shoe
    ? `The ${title} is made in small runs. Clean lines, a sharp last and nothing extra.`
    : `The ${title} is cut in Lagos in small runs. Clean lines, a sharp fit through the shoulder and nothing extra.`;
}

export const DEMO_PRODUCTS: Product[] = SEED.map(([slug, title, catId, naira, colours, imgs, opts], i) => {
  const category = DEMO_CATEGORIES.find((c) => c.id === catId)!;
  const shoe = category.type === 'shoes';
  const sizes = shoe ? SHOE_SIZES : CLOTH_SIZES;
  const soldSize = shoe ? '45' : 'XXL';
  const created = new Date(Date.UTC(2026, 10, 9 - i)).toISOString();
  return {
    id: `p-${i + 1}`,
    slug,
    title,
    price: naira * 100,
    compare_at_price: null,
    description: describe(title, shoe),
    care: shoe
      ? 'Full-grain leather upper, leather lining, rubber sole. Wipe clean, store with shoe trees.'
      : 'Premium heavyweight fabric. Cold wash inside out, hang to dry, warm iron.',
    is_new: !!opts?.isNew,
    is_featured: !!opts?.featured,
    status: 'active',
    created_at: created,
    category,
    images: [imgs[0], imgs[1], imgs[0]].map((id, n) => ({
      path: `/img/hk-${id}.jpg`,
      alt: `${title} — ${['front', 'back', 'detail'][n]}`,
      sort: n,
    })),
    variants: colours.flatMap((colour) =>
      sizes.map((size) => ({
        id: `v-${i + 1}-${colour}-${size}`,
        size,
        colour,
        colour_hex: COLOURS[colour] ?? null,
        stock: opts?.soldOut || size === soldSize ? 0 : 6,
      })),
    ),
  };
});

export const DEMO_LOOKS = [
  {
    no: 'LOOK 01',
    name: 'Night shift',
    desc: 'Leather over a heavy tee, wide cargo, clean white court. Built for the drive across Third Mainland.',
    img: '/img/hk-19168186.jpg',
    slugs: ['leather-bomber', 'heavyweight-logo-tee', 'parachute-cargo', 'court-leather-sneaker'],
  },
  {
    no: 'LOOK 02',
    name: 'Island',
    desc: 'A boxy oxford with straight denim and a suede loafer. Dinner on the Island, no tie.',
    img: '/img/hk-935966.jpg',
    slugs: ['boxy-oxford-shirt', 'washed-straight-denim', 'suede-penny-loafer'],
  },
  {
    no: 'LOOK 03',
    name: 'Off duty',
    desc: 'The knit set, worn together or split. Weekend in one piece.',
    img: '/img/hk-7562644.jpg',
    slugs: ['knit-polo-set', 'knit-zip-polo', 'court-leather-sneaker'],
  },
];

export const INSTAGRAM_IMAGES = [7562644, 12628400, 6311231, 935966, 6311503, 19168186].map((id) => `/img/hk-${id}.jpg`);
