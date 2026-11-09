export type CategoryType = 'clothing' | 'shoes';

export interface Category {
  id: string;
  type: CategoryType;
  name: string;
  slug: string;
  sort: number;
  image_path: string | null;
}

export interface ProductImage {
  id?: string;
  path: string;
  alt: string;
  sort: number;
}

export interface Variant {
  id: string;
  size: string;
  colour: string;
  colour_hex: string | null;
  stock: number;
  sku?: string | null;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  price: number; // kobo
  compare_at_price: number | null;
  description: string;
  care: string;
  is_new: boolean;
  is_featured: boolean;
  status: 'active' | 'archived';
  created_at: string;
  category: Category | null;
  images: ProductImage[];
  variants: Variant[];
}

export interface Settings {
  delivery_fee: number; // kobo
  quote_expiry_days: number;
  whatsapp: string;
  instagram: string;
  announcement: string;
  hero_images: string[];
}

export interface Address {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  state: string;
  city: string;
  street: string;
  landmark: string;
  is_default: boolean;
}

export interface Measurements {
  chest: number | null;
  waist: number | null;
  hips: number | null;
  shoulder: number | null;
  sleeve: number | null;
  length: number | null;
  inseam: number | null;
  shoe_size: string | null;
  shoe_system: 'EU' | 'UK' | null;
  foot_length_cm: number | null;
  updated_at?: string;
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'paid_out_of_stock'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'expired'
  | 'cancelled';

export type CustomStatus =
  | 'submitted'
  | 'needs_info'
  | 'quoted'
  | 'declined'
  | 'expired'
  | 'paid'
  | 'in_production'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };
