'use client';
import { useFormState } from 'react-dom';
import { saveSettings } from '@/app/actions/admin';
import { Field, FormError, FormNote, TextArea } from '@/components/Field';
import { Submit } from '@/components/Submit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SettingsForm({ s }: { s: any }) {
  const [state, action] = useFormState(saveSettings, null);
  return (
    <form action={action} className="grid max-w-[720px] grid-cols-1 gap-5 sm:grid-cols-2">
      <Field label="Flat delivery fee (₦)" name="delivery_fee" inputMode="numeric" defaultValue={String((s?.delivery_fee ?? 0) / 100)} hint="Applied to every order, anywhere in Nigeria." />
      <Field label="Quote expiry (days)" name="quote_expiry_days" inputMode="numeric" defaultValue={String(s?.quote_expiry_days ?? 7)} />
      <Field label="Store WhatsApp number" name="whatsapp" defaultValue={s?.whatsapp ?? ''} placeholder="+234 803 555 0142" />
      <Field label="Instagram link" name="instagram" defaultValue={s?.instagram ?? ''} />
      <Field label="Announcement bar" name="announcement" defaultValue={s?.announcement ?? ''} className="sm:col-span-2" hint="One line. Leave empty to hide the bar." />
      <TextArea
        label="Homepage hero images"
        name="hero_images"
        rows={3}
        defaultValue={(s?.hero_images ?? []).join('\n')}
        className="sm:col-span-2"
        hint="One per line: a path in the products bucket or a /img/… file. The first one is used."
      />
      <div className="flex flex-col gap-3 sm:col-span-2">
        {state && (state.ok ? <FormNote>{state.message}</FormNote> : <FormError>{state.error}</FormError>)}
        <div>
          <Submit pendingText="Saving…">Save settings</Submit>
        </div>
      </div>
    </form>
  );
}
