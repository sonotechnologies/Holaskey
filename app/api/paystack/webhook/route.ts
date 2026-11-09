import { NextResponse } from 'next/server';
import { processChargeSuccess } from '@/lib/payments';
import { validSignature } from '@/lib/paystack';

export const dynamic = 'force-dynamic';

/**
 * Paystack webhook. Set its URL in the Paystack dashboard to https://<site>/api/paystack/webhook.
 * The body signature is checked, then the transaction is re-verified with Paystack's API
 * before anything is marked paid.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get('x-paystack-signature'))) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }
  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  if (event.event === 'charge.success' && event.data?.reference) {
    try {
      await processChargeSuccess(event.data.reference);
    } catch (e) {
      console.error('[paystack webhook]', e);
      // 500 makes Paystack retry later.
      return NextResponse.json({ error: 'processing failed' }, { status: 500 });
    }
  }
  return NextResponse.json({ received: true });
}
