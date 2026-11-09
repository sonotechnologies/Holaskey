import type { CustomStatus, OrderStatus } from './types';

/** Kobo → "₦185,000" */
export function naira(kobo: number | null | undefined): string {
  const n = Math.round((kobo ?? 0) / 100);
  return '₦' + n.toLocaleString('en-NG');
}

/** "185,000" or "185000" → kobo */
export function parseNaira(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined || input === '') return null;
  const digits = String(input).replace(/[^\d.]/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export function formatDate(iso: string | null | undefined, withYear = true): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'Africa/Lagos',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Lagos',
  });
}

/** Nigerian mobile numbers → +234XXXXXXXXXX, or null if invalid. */
export function normalisePhone(raw: string): string | null {
  const d = raw.replace(/[^\d+]/g, '');
  let local: string | null = null;
  if (/^\+234\d{10}$/.test(d)) local = d.slice(4);
  else if (/^234\d{10}$/.test(d)) local = d.slice(3);
  else if (/^0\d{10}$/.test(d)) local = d.slice(1);
  else if (/^\d{10}$/.test(d)) local = d;
  if (!local || !/^[789]/.test(local)) return null;
  return '+234' + local;
}

export function displayPhone(p: string): string {
  const m = /^\+234(\d{3})(\d{3})(\d{4})$/.exec(p);
  return m ? `+234 ${m[1]} ${m[2]} ${m[3]}` : p;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid',
  paid_out_of_stock: 'Paid — out of stock',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export const CUSTOM_STATUS_LABEL: Record<CustomStatus, string> = {
  submitted: 'Submitted',
  needs_info: 'Question for you',
  quoted: 'Quote ready',
  declined: 'Declined',
  expired: 'Quote expired',
  paid: 'Paid',
  in_production: 'In production',
  ready: 'Ready',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/** Statuses that get the terracotta tag (customer action needed). */
export const HIGHLIGHT_STATUSES = new Set<string>(['quoted', 'needs_info', 'paid_out_of_stock']);

export const ORDER_TRACK: OrderStatus[] = ['paid', 'processing', 'shipped', 'delivered'];
export const CUSTOM_TRACK = ['submitted', 'quoted', 'paid', 'in_production', 'shipped', 'delivered'] as const;
export const CUSTOM_TRACK_LABELS = ['Submitted', 'Quoted', 'Paid', 'In production', 'Shipped', 'Delivered'];

export function customTrackIndex(status: CustomStatus): number {
  switch (status) {
    case 'submitted':
    case 'needs_info':
      return 0;
    case 'quoted':
    case 'declined':
    case 'expired':
      return 1;
    case 'paid':
      return 2;
    case 'in_production':
    case 'ready':
      return 3;
    case 'shipped':
      return 4;
    case 'delivered':
      return 5;
    default:
      return 0;
  }
}

export function orderTrackIndex(status: OrderStatus): number {
  switch (status) {
    case 'paid':
    case 'paid_out_of_stock':
      return 0;
    case 'processing':
      return 1;
    case 'shipped':
      return 2;
    case 'delivered':
      return 3;
    default:
      return -1;
  }
}
