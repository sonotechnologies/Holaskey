'use client';
import { useState, useTransition } from 'react';
import { removeCartItem, setCartQty } from '@/app/actions/shop';

export function QtyControl({ id, qty, max, title }: { id: string; qty: number; max: number; title: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState('');
  const set = (n: number) =>
    start(async () => {
      const r = await setCartQty(id, n);
      setMsg(r.ok ? '' : r.error);
    });
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center border border-line" aria-busy={pending}>
        <button type="button" aria-label={`Decrease quantity of ${title}`} disabled={pending || qty <= 1} onClick={() => set(qty - 1)} className="h-10 w-11 text-lg disabled:opacity-40">
          −
        </button>
        <span className="min-w-6 text-center font-mono text-[13px]" aria-live="polite">
          {qty}
        </span>
        <button type="button" aria-label={`Increase quantity of ${title}`} disabled={pending || qty >= max} onClick={() => set(qty + 1)} className="h-10 w-11 text-lg disabled:opacity-40">
          +
        </button>
      </div>
      <button type="button" disabled={pending} onClick={() => start(() => removeCartItem(id))} className="link h-10">
        Remove
      </button>
      {msg && <span className="text-sm text-muted">{msg}</span>}
    </div>
  );
}
