'use client';
import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { joinNewsletter } from '@/app/actions/misc';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  }, []);
  const set = (t: 'dark' | 'light') => {
    setTheme(t);
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem('hk-theme', t);
    } catch {}
  };
  return (
    <div role="group" aria-label="Colour theme" className="flex border border-line">
      {(['dark', 'light'] as const).map((t) => (
        <button
          key={t}
          type="button"
          aria-pressed={theme === t}
          onClick={() => set(t)}
          className={`label-sm h-9 min-w-[64px] px-3 ${theme === t ? 'bg-ink text-bg' : 'text-ink'}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

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
