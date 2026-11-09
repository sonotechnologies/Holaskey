import 'server-only';
import { emails, OWNER_EMAIL } from './email';
import { verifyTransaction } from './paystack';
import { createServiceClient } from './supabase/server';

/**
 * Confirms a Paystack charge and records it. Used by the webhook and as a fallback on the
 * success page. Safe to call more than once: the database functions are idempotent.
 */
export async function processChargeSuccess(reference: string): Promise<{ kind: 'order' | 'custom' | 'unknown'; status: string }> {
  const tx = await verifyTransaction(reference);
  if (tx.status !== 'success' || tx.currency !== 'NGN') return { kind: 'unknown', status: tx.status };

  const db = createServiceClient();

  if (reference.startsWith('HLKC_')) {
    const { data, error } = await db.rpc('mark_custom_paid', { p_ref: reference, p_amount: tx.amount });
    if (error) throw error;
    const row = data?.[0];
    if (row?.changed) {
      const { data: r } = await db
        .from('custom_requests')
        .select('id, number, user_id, quote_amount, quote_delivery')
        .eq('id', row.request_id)
        .single();
      if (r) {
        const total = (r.quote_amount ?? 0) + (r.quote_delivery ?? 0);
        const email = await userEmail(r.user_id);
        await Promise.all([
          email && emails.customPaid(email, { number: r.number, id: r.id, total }),
          OWNER_EMAIL && emails.customPaidOwner({ number: r.number, id: r.id, total }),
        ]);
      }
    }
    return { kind: 'custom', status: row?.status ?? 'unknown' };
  }

  const { data, error } = await db.rpc('mark_order_paid', { p_ref: reference, p_amount: tx.amount });
  if (error) throw error;
  const row = data?.[0];
  if (row?.changed) {
    const { data: o } = await db
      .from('orders')
      .select('id, number, user_id, total, email, address, items:order_items(title, size, colour, qty, unit_price)')
      .eq('id', row.order_id)
      .single();
    if (o) {
      const lines = o.items ?? [];
      await Promise.all([
        o.email && emails.orderPaid(o.email, { number: o.number, id: o.id, total: o.total, lines, name: o.address?.recipient ?? '' }),
        OWNER_EMAIL &&
          emails.orderPaidOwner({ number: o.number, id: o.id, total: o.total, lines, outOfStock: row.status === 'paid_out_of_stock' }),
      ]);
    }
  }
  return { kind: 'order', status: row?.status ?? 'unknown' };
}

export async function userEmail(userId: string): Promise<string | null> {
  const db = createServiceClient();
  const { data } = await db.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}
