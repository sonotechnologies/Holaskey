import { SUPABASE_URL } from './env';

/** Resolves a stored image path to a URL. Paths starting with "/" are files in /public. */
export function productImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('/') || path.startsWith('http')) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/products/${path}`;
}

export const ACCEPTED_REF_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
export const MAX_REF_BYTES = 8 * 1024 * 1024;
export const MAX_REFS = 5;
