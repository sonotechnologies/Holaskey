'use client';
import { useState } from 'react';
import { useFormState } from 'react-dom';
import { startCheckout } from '@/app/actions/checkout';
import { Field, FormError, Select } from '@/components/Field';
import { Img } from '@/components/Img';
import { Submit } from '@/components/Submit';
import { displayPhone } from '@/lib/format';
import { NG_STATES } from '@/lib/ng';
import type { Address } from '@/lib/types';

interface Summary {
  lines: { id: string; title: string; meta: string; qty: number; price: string; image: string | null }[];
  subtotal: string;
  delivery: string;
  total: string;
}

export function CheckoutForm({ email, emailVerified, name, phone, addresses, summary }: { email: string; emailVerified: boolean; name: string; phone: string; addresses: Address[]; summary: Summary }) {
  const [state, action] = useFormState(startCheckout, null);
  const [sel, setSel] = useState<string>(addresses[0]?.id ?? 'new');

  return (
    <form action={action} className="flex flex-wrap items-start gap-8 lg:gap-16">
      <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-10">
        <section className="flex flex-col gap-4">
          <h2 className="h2 !text-[clamp(20px,1.65vw,24px)]">
            <span className="label mr-3 text-muted">01</span>Contact
          </h2>
          <p className="text-[15px]">
            {email}
            {!emailVerified && (
              <span className="mt-1 block text-sm">
                <span className="label text-err">Error</span> Verify this email before paying. We sent you a link when you signed up.
              </span>
            )}
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="h2 !text-[clamp(20px,1.65vw,24px)]">
            <span className="label mr-3 text-muted">02</span>Delivery address
          </h2>
          <div role="radiogroup" aria-label="Delivery address" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {addresses.map((a) => (
              <label
                key={a.id}
                className={`flex min-h-[132px] cursor-pointer flex-col gap-1 border bg-smoke p-4 text-sm leading-normal ${sel === a.id ? 'border-ink' : 'border-line'}`}
              >
                <input type="radio" name="address_id" value={a.id} checked={sel === a.id} onChange={() => setSel(a.id)} className="sr-only" />
                <span className="label mb-1 flex justify-between">
                  <span>{a.label}</span>
                  {sel === a.id && <span className="text-accent">Selected</span>}
                </span>
                <span>{a.recipient}</span>
                <span className="text-muted">
                  {a.street}, {a.city}, {a.state}
                </span>
                <span className="text-muted">{displayPhone(a.phone)}</span>
              </label>
            ))}
            <label className={`flex min-h-[132px] cursor-pointer flex-col gap-1 border bg-smoke p-4 text-sm ${sel === 'new' ? 'border-solid border-ink' : 'border-dashed border-muted'}`}>
              <input type="radio" name="address_id" value="new" checked={sel === 'new'} onChange={() => setSel('new')} className="sr-only" />
              <span className="label mb-1 flex justify-between">
                <span>+ New address</span>
                {sel === 'new' && <span className="text-accent">Selected</span>}
              </span>
              <span>Deliver somewhere else</span>
            </label>
          </div>
          {sel === 'new' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name" name="recipient" defaultValue={name} autoComplete="name" required />
              <Field label="Phone (WhatsApp)" name="phone" defaultValue={phone ? displayPhone(phone) : ''} inputMode="tel" autoComplete="tel" placeholder="0803 555 0142" required />
              <Field label="Street address" name="street" autoComplete="street-address" className="sm:col-span-2" required />
              <Field label="Landmark (optional)" name="landmark" placeholder="Opposite the filling station" className="sm:col-span-2" />
              <Field label="City" name="city" autoComplete="address-level2" required />
              <Select label="State" name="state" defaultValue="Lagos" required>
                {NG_STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
              <label className="flex items-center gap-3 text-[15px] sm:col-span-2">
                <input type="checkbox" name="save_address" defaultChecked className="h-5 w-5 accent-[rgb(var(--hk-accent))]" />
                Save this address to my account
              </label>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="h2 !text-[clamp(20px,1.65vw,24px)]">
            <span className="label mr-3 text-muted">03</span>Delivery
          </h2>
          <div className="flex justify-between gap-4 border border-ink p-4 text-[15px]">
            <span>Flat delivery · 1–2 days in Lagos, 3–5 days elsewhere</span>
            <span className="font-semibold">{summary.delivery}</span>
          </div>
        </section>
      </div>

      <aside className="flex flex-[1_1_320px] flex-col gap-3.5 bg-espresso p-7 lg:sticky lg:top-24">
        <h2 className="label">Order summary</h2>
        {summary.lines.map((l) => (
          <div key={l.id} className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 text-sm">
            <div className="relative aspect-[4/5] bg-smoke">{l.image && <Img src={l.image} alt="" fill sizes="48px" className="object-cover" />}</div>
            <div className="flex flex-col leading-snug">
              <span className="font-medium">{l.title}</span>
              <span className="text-muted">
                {l.meta} · ×{l.qty}
              </span>
            </div>
            <span className="font-semibold">{l.price}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-line pt-3.5">
          <span>Subtotal</span>
          <span className="font-semibold">{summary.subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery</span>
          <span className="font-semibold">{summary.delivery}</span>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-3.5">
          <span className="label">Total</span>
          <span className="text-[22px] font-semibold">{summary.total}</span>
        </div>
        {state && !state.ok && <FormError>{state.error}</FormError>}
        <Submit pendingText="Opening Paystack…" className="mt-2 w-full">
          Pay with Paystack
        </Submit>
        <p className="text-center text-[13px] text-muted">Card, bank transfer or USSD. Secured by Paystack.</p>
      </aside>
    </form>
  );
}
