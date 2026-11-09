import { NextResponse } from 'next/server';
import { emails } from '@/lib/email';
import { userEmail } from '@/lib/payments';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Daily (vercel.json): expire unpaid orders (24 h) and old quotes, and send "quote expiring in 24 h" emails. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const db = createServiceClient();
  await db.rpc('expire_stale');

  const soon = new Date(Date.now() + 36 * 3600000).toISOString();
  const { data: expiring } = await db
    .from('custom_requests')
    .select('id, number, user_id, quote_amount, quote_delivery')
    .eq('status', 'quoted')
    .eq('quote_reminder_sent', false)
    .lte('quote_expires_at', soon);
  for (const r of expiring ?? []) {
    const to = await userEmail(r.user_id);
    if (to) await emails.quoteExpiring(to, { number: r.number, id: r.id, total: (r.quote_amount ?? 0) + (r.quote_delivery ?? 0) });
    await db.from('custom_requests').update({ quote_reminder_sent: true }).eq('id', r.id);
  }
  return NextResponse.json({ ok: true, reminders: expiring?.length ?? 0 });
}
