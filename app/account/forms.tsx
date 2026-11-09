'use client';
import Link from 'next/link';
import { useTransition } from 'react';
import { useFormState } from 'react-dom';
import { deleteAddress, saveAddress, saveMeasurements, setDefaultAddress, updateProfile } from '@/app/actions/account';
import { Field, FormError, FormNote, Select } from '@/components/Field';
import { ClothingMeasureFields, ShoeFields } from '@/components/MeasureFields';
import { Submit } from '@/components/Submit';
import { displayPhone } from '@/lib/format';
import { NG_STATES } from '@/lib/ng';
import type { Address, Measurements } from '@/lib/types';

export function ProfileForm({ name, phone, email, verified }: { name: string; phone: string; email: string; verified: boolean }) {
  const [state, action] = useFormState(updateProfile, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Full name" name="full_name" defaultValue={name} autoComplete="name" required />
      <Field label="Email" name="email" defaultValue={email} readOnly hint={verified ? 'Verified.' : 'Not verified yet — check your inbox for the link.'} />
      <Field label="Phone (WhatsApp)" name="phone" defaultValue={phone} type="tel" autoComplete="tel" required />
      {state && (state.ok ? <FormNote>{state.message}</FormNote> : <FormError>{state.error}</FormError>)}
      <div>
        <Submit pendingText="Saving…">Save</Submit>
      </div>
    </form>
  );
}

export function AddressCard({ a }: { a: Address }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-1 border border-line bg-smoke p-5 text-[15px]" aria-busy={pending}>
      <span className="label mb-1 flex justify-between">
        <span>{a.label}</span>
        {a.is_default && <span className="text-accent">Default</span>}
      </span>
      <span>{a.recipient}</span>
      <span className="text-muted">
        {a.street}
        {a.landmark ? ` (${a.landmark})` : ''}, {a.city}, {a.state}
      </span>
      <span className="text-muted">{displayPhone(a.phone)}</span>
      <div className="mt-3 flex flex-wrap gap-5">
        <Link href={`/account/addresses?edit=${a.id}`} className="link">
          Edit
        </Link>
        {!a.is_default && (
          <button type="button" className="link" onClick={() => start(() => setDefaultAddress(a.id))}>
            Make default
          </button>
        )}
        <button type="button" className="link" onClick={() => start(() => deleteAddress(a.id))}>
          Remove
        </button>
      </div>
    </div>
  );
}

export function AddressForm({ a }: { a?: Address }) {
  const [state, action] = useFormState(saveAddress, null);
  return (
    <form action={action} className="grid max-w-[720px] grid-cols-1 gap-4 sm:grid-cols-2">
      {a && <input type="hidden" name="id" value={a.id} />}
      <Field label="Label" name="label" defaultValue={a?.label ?? 'Home'} placeholder="Home, Office…" />
      <Field label="Full name" name="recipient" defaultValue={a?.recipient} autoComplete="name" required />
      <Field label="Phone" name="phone" defaultValue={a ? displayPhone(a.phone) : ''} type="tel" autoComplete="tel" required />
      <Field label="City" name="city" defaultValue={a?.city} autoComplete="address-level2" required />
      <Field label="Street address" name="street" defaultValue={a?.street} autoComplete="street-address" className="sm:col-span-2" required />
      <Field label="Landmark (optional)" name="landmark" defaultValue={a?.landmark} className="sm:col-span-2" />
      <Select label="State" name="state" defaultValue={a?.state ?? 'Lagos'}>
        {NG_STATES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </Select>
      <label className="flex items-center gap-3 self-end pb-3 text-[15px]">
        <input type="checkbox" name="is_default" defaultChecked={a?.is_default} className="h-5 w-5 accent-[rgb(var(--hk-accent))]" />
        Default address
      </label>
      {state && !state.ok && (
        <div className="sm:col-span-2">
          <FormError>{state.error}</FormError>
        </div>
      )}
      <div className="flex items-center gap-5 sm:col-span-2">
        <Submit pendingText="Saving…">Save address</Submit>
        <Link href="/account/addresses" className="link">
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function MeasurementsForm({ m }: { m: Partial<Measurements> | null }) {
  const [state, action] = useFormState(saveMeasurements, null);
  return (
    <form action={action} className="flex max-w-[900px] flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h2 className="h2">Clothing</h2>
        <ClothingMeasureFields initial={m} />
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="h2">Shoes</h2>
        <ShoeFields initial={m} />
      </section>
      {state && (state.ok ? <FormNote>{state.message}</FormNote> : <FormError>{state.error}</FormError>)}
      <div>
        <Submit pendingText="Saving…">Save measurements</Submit>
      </div>
    </form>
  );
}
