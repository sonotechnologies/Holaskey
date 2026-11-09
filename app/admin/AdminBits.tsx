'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { markRefunded, runExpiry, setOrderStatus, setTrackingNote } from '@/app/actions/admin';
import { FormError, FormNote } from '@/components/Field';
import { ORDER_STATUS_LABEL } from '@/lib/format';
import type { OrderStatus } from '@/lib/types';

export function RunExpiry() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState('');
  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-sm text-muted">{msg}</span>}
      <button type="button" disabled={pending} onClick={() => start(async () => setMsg((await runExpiry()).ok ? 'Done.' : 'Failed.'))} className="link">
        Expire stale orders &amp; quotes
      </button>
    </div>
  );
}

const ORDER_NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  paid: ['processing', 'shipped'],
  processing: ['shipped'],
  shipped: ['delivered'],
  paid_out_of_stock: ['processing', 'cancelled'],
};

export function OrderControls({ id, status, tracking, refunded }: { id: string; status: OrderStatus; tracking: string | null; refunded: boolean }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState(tracking ?? '');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();
  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) =>
    start(async () => {
      const r = await fn();
      setMsg({ ok: r.ok, text: r.ok ? r.message ?? 'Saved.' : r.error ?? 'Failed.' });
      router.refresh();
    });
  const next = ORDER_NEXT[status] ?? [];
  return (
    <div className="flex flex-col gap-4 border-t-2 border-accent bg-espresso p-5 lg:p-6">
      <span className="label">Update · {ORDER_STATUS_LABEL[status]}</span>
      <div className="flex flex-col">
        <label htmlFor="tracking" className="field-label">
          Tracking note (optional)
        </label>
        <input id="tracking" value={note} onChange={(e) => setNote(e.target.value)} placeholder="GIG Logistics · waybill 123456" className="field" />
      </div>
      <div className="flex flex-wrap gap-2">
        {next.map((to) => (
          <button key={to} type="button" disabled={pending} onClick={() => run(() => setOrderStatus(id, to, note))} className={to === 'cancelled' ? 'btn-secondary' : 'btn-primary'}>
            Mark {ORDER_STATUS_LABEL[to].toLowerCase()}
          </button>
        ))}
        <button type="button" disabled={pending} onClick={() => run(() => setTrackingNote(id, note))} className="btn-secondary">
          Save note
        </button>
      </div>
      {(status === 'paid_out_of_stock' || status === 'cancelled') && !refunded && (
        <button type="button" disabled={pending} onClick={() => confirm('Mark this order as refunded? Do the refund in Paystack first.') && run(() => markRefunded(id))} className="link self-start">
          Mark refund given
        </button>
      )}
      {msg && (msg.ok ? <FormNote>{msg.text}</FormNote> : <FormError>{msg.text}</FormError>)}
    </div>
  );
}
