import 'server-only';
import crypto from 'node:crypto';

const API = 'https://api.paystack.co';

function secret() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set');
  return key;
}

export function newReference(prefix: 'HLK' | 'HLKC') {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(5).toString('hex')}`;
}

/** Creates a Paystack transaction and returns the hosted checkout URL (Redirect flow). */
export async function initializeTransaction(input: {
  email: string;
  amount: number; // kobo
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}): Promise<string> {
  const res = await fetch(`${API}/transaction/initialize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email,
      amount: input.amount,
      currency: 'NGN',
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
      channels: ['card', 'bank', 'ussd', 'bank_transfer'],
    }),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || !json.status) throw new Error(json.message || 'Paystack could not start the payment');
  return json.data.authorization_url as string;
}

export interface VerifiedTransaction {
  reference: string;
  status: string; // 'success' | 'failed' | 'abandoned' | ...
  amount: number; // kobo
  currency: string;
  metadata: Record<string, unknown> | null;
}

/** Asks Paystack for the transaction's real state (never trust the webhook body alone). */
export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret()}` },
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || !json.status) throw new Error(json.message || 'Paystack verification failed');
  const d = json.data;
  return { reference: d.reference, status: d.status, amount: d.amount, currency: d.currency, metadata: d.metadata ?? null };
}

export function validSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const hash = crypto.createHmac('sha512', secret()).update(rawBody).digest('hex');
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
