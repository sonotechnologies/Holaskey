'use client';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { requestReset, signIn, signInWithGoogle, signUp, updatePassword } from '@/app/actions/auth';
import { Field, FormError, FormNote } from '@/components/Field';
import { Submit } from '@/components/Submit';

function GoogleButton({ next }: { next: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next} />
      <Submit variant="secondary" className="w-full" pendingText="Opening Google…">
        <span className="font-sans text-base font-semibold normal-case tracking-normal" aria-hidden>
          G
        </span>
        Continue with Google
      </Submit>
    </form>
  );
}

function Divider() {
  return (
    <div className="label-sm flex items-center gap-3 text-muted">
      <span className="h-px flex-1 bg-line" />
      or with email
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, action] = useFormState(signIn, null);
  return (
    <>
      <h1 className="h1 mt-2">Welcome back</h1>
      {notice && <FormError>{notice}</FormError>}
      <GoogleButton next={next} />
      <Divider />
      <form action={action} className="flex flex-col gap-5">
        <input type="hidden" name="next" value={next} />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <div className="flex flex-col">
          <div className="mb-1.5 flex justify-between">
            <label htmlFor="f-password" className="label">
              Password
            </label>
            <Link href="/reset-password" className="text-[13px] underline underline-offset-[3px]">
              Forgot?
            </Link>
          </div>
          <input id="f-password" name="password" type="password" autoComplete="current-password" required className="field" />
        </div>
        {state && !state.ok && <FormError>{state.error}</FormError>}
        <Submit pendingText="Logging in…" className="mt-1">
          Log in
        </Submit>
      </form>
    </>
  );
}

export function SignupForm({ next }: { next: string }) {
  const [state, action] = useFormState(signUp, null);
  if (state?.ok)
    return (
      <>
        <h1 className="h1 mt-2">Check your email</h1>
        <FormNote>{state.message}</FormNote>
      </>
    );
  return (
    <>
      <h1 className="h1 mt-2">Create account</h1>
      <GoogleButton next={next} />
      <Divider />
      <form action={action} className="flex flex-col gap-5">
        <input type="hidden" name="next" value={next} />
        <Field label="Full name" name="full_name" autoComplete="name" required />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field label="Phone (WhatsApp)" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 555 0142" hint="Nigerian number. We use it for delivery updates." required />
        <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={8} hint="At least 8 characters." required />
        {state && !state.ok && <FormError>{state.error}</FormError>}
        <Submit pendingText="Creating account…" className="mt-1">
          Create account
        </Submit>
      </form>
    </>
  );
}

export function ResetForm() {
  const [state, action] = useFormState(requestReset, null);
  return (
    <>
      <h1 className="h1">Reset password</h1>
      <p className="text-muted">We&apos;ll email you a link to choose a new one.</p>
      <form action={action} className="flex flex-col gap-5">
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        {state && (state.ok ? <FormNote>{state.message}</FormNote> : <FormError>{state.error}</FormError>)}
        <Submit pendingText="Sending…">Send reset link</Submit>
        <Link href="/login" className="link">
          Back to log in
        </Link>
      </form>
    </>
  );
}

export function NewPasswordForm() {
  const [state, action] = useFormState(updatePassword, null);
  return (
    <>
      <h1 className="h1">New password</h1>
      <form action={action} className="flex flex-col gap-5">
        <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        {state && !state.ok && <FormError>{state.error}</FormError>}
        <Submit pendingText="Saving…">Save password</Submit>
      </form>
    </>
  );
}
