'use client';
import { useTheme } from '@/lib/theme';
import { MoonIcon, SunIcon } from './icons';

/** Header icon button: one tap flips dark ↔ light. */
export function ThemeIconButton({ className = '' }: { className?: string }) {
  const [theme, set] = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={() => set(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={`flex h-11 w-11 items-center justify-center text-ink hover:text-accent ${className}`}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

/** Labelled Dark / Light segmented switch (footer, mobile menu). */
export function ThemeSwitch({ className = '' }: { className?: string }) {
  const [theme, set] = useTheme();
  return (
    <div role="group" aria-label="Colour theme" className={`flex border border-line ${className}`}>
      {(['dark', 'light'] as const).map((t) => (
        <button
          key={t}
          type="button"
          aria-pressed={theme === t}
          onClick={() => set(t)}
          className={`label-sm flex h-10 min-w-[72px] items-center justify-center gap-2 px-3 ${theme === t ? 'bg-ink text-bg' : 'text-ink'}`}
        >
          {t === 'dark' ? <MoonIcon size={14} /> : <SunIcon size={14} />}
          {t}
        </button>
      ))}
    </div>
  );
}
