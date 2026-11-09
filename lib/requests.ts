import 'server-only';
import { createClient } from './supabase/server';
import type { CustomStatus } from './types';

export interface RequestImage {
  id: string;
  path: string;
  url: string | null;
  note: string;
  kind: 'reference' | 'progress';
}
export interface RequestMessage {
  id: string;
  body: string;
  fromAdmin: boolean;
  createdAt: string;
  images: { path: string; url: string | null }[];
}

/** Loads a custom request with signed image URLs (RLS: only the owner or an admin gets a row). */
export async function loadRequest(id: string) {
  const supabase = createClient();
  const { data: r } = await supabase.from('custom_requests').select('*, product:products(slug, title)').eq('id', id).maybeSingle();
  if (!r) return null;

  const [{ data: imgs }, { data: msgs }, { data: events }, { data: profile }] = await Promise.all([
    supabase.from('custom_request_images').select('id, path, note, kind, created_at').eq('request_id', id).order('created_at'),
    supabase.from('custom_messages').select('id, body, from_admin, image_paths, created_at').eq('request_id', id).order('created_at'),
    supabase.from('status_events').select('from_status, to_status, note, created_at').eq('entity', 'custom').eq('entity_id', id).order('created_at', { ascending: false }),
    supabase.from('profiles').select('full_name, phone, email').eq('user_id', r.user_id).maybeSingle(),
  ]);

  const allPaths = [...(imgs ?? []).map((i) => i.path), ...(msgs ?? []).flatMap((m) => m.image_paths as string[])];
  const { data: signed } = allPaths.length ? await supabase.storage.from('custom-refs').createSignedUrls(allPaths, 3600) : { data: [] };
  const urlFor = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  return {
    id: r.id as string,
    number: r.number as string,
    userId: r.user_id as string,
    kind: r.kind as 'clothing' | 'shoes',
    itemType: r.item_type as string,
    description: r.description as string,
    colourMaterial: r.colour_material as string,
    measurements: (r.measurements ?? {}) as Record<string, number | string | null>,
    product: r.product as { slug: string; title: string } | null,
    budgetMin: r.budget_min as number | null,
    budgetMax: r.budget_max as number | null,
    neededBy: r.needed_by as string | null,
    status: r.status as CustomStatus,
    quote: {
      amount: r.quote_amount as number | null,
      delivery: r.quote_delivery as number | null,
      days: r.quote_days as number | null,
      note: r.quote_note as string | null,
      expiresAt: r.quote_expires_at as string | null,
    },
    cancelReason: r.cancel_reason as string | null,
    paystackRef: r.paystack_ref as string | null,
    createdAt: r.created_at as string,
    customer: profile as { full_name: string; phone: string; email: string } | null,
    images: (imgs ?? []).map((i) => ({ id: i.id, path: i.path, url: urlFor.get(i.path) ?? null, note: i.note, kind: i.kind })) as RequestImage[],
    messages: (msgs ?? []).map((m) => ({
      id: m.id,
      body: m.body,
      fromAdmin: m.from_admin,
      createdAt: m.created_at,
      images: (m.image_paths as string[]).map((p) => ({ path: p, url: urlFor.get(p) ?? null })),
    })) as RequestMessage[],
    events: (events ?? []) as { from_status: string | null; to_status: string; note: string | null; created_at: string }[],
  };
}

export type LoadedRequest = NonNullable<Awaited<ReturnType<typeof loadRequest>>>;
