'use client';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env';
import { getBrowserClient } from './supabase/client';

/** Uploads a file straight to Supabase Storage with real progress (XHR), as the signed-in user. */
export async function uploadWithProgress(bucket: string, path: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  const supabase = getBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('You need to be logged in to upload photos.');
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(uploadError(xhr))));
    xhr.onerror = () => reject(new Error('The upload failed. Check your connection and try again.'));
    xhr.send(file);
  });
  onProgress(100);
}

function uploadError(xhr: XMLHttpRequest) {
  try {
    const j = JSON.parse(xhr.responseText);
    if (String(j.statusCode) === '413' || /size/i.test(j.message)) return 'That photo is too large. The limit is 8 MB.';
    if (/mime|type/i.test(j.message)) return 'That file type is not supported. Use JPG, PNG, WebP or HEIC.';
    return j.message || 'The upload failed. Try again.';
  } catch {
    return 'The upload failed. Try again.';
  }
}

export function fileExt(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && /^(jpe?g|png|webp|heic|heif)$/.test(fromName)) return fromName;
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif' }[file.type] ?? 'jpg';
}
