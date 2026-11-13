'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { joinNewsletter } from '@/app/actions/misc';

export { ThemeSwitch as ThemeToggle } from './ThemeToggle';

function JoinButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="label h-12 bg-ink px-4 text-bg disabled:opacity-60">
      Join
    </button>
  );
}

export function NewsletterForm() {
  const [state, action] = useFormState(joinNewsletter, null);
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input id="newsletter-email" name="email" type="email" required placeholder="Email address" className="field border-r-0 text-[15px]" />
        <JoinButton />
      </div>
      {state && (
        <p role="status" className="text-sm">
          {state.ok ? state.message : state.error}
        </p>
      )}
    </form>
  );
}
