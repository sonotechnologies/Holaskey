'use client';
import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
const EVENT = 'hk-theme-change';

export function currentTheme(): Theme {
  return typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function setTheme(t: Theme) {
  const root = document.documentElement;
  // Smooth colour change, skipped for reduced motion.
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('theme-anim');
    window.setTimeout(() => root.classList.remove('theme-anim'), 350);
  }
  root.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'light' ? '#F4EEE6' : '#120D0A');
  try {
    localStorage.setItem('hk-theme', t);
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: t }));
}

/** Theme state shared by every toggle on the page (header, mobile menu, footer). */
export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, set] = useState<Theme>('dark');
  useEffect(() => {
    set(currentTheme());
    const on = () => set(currentTheme());
    window.addEventListener(EVENT, on);
    window.addEventListener('storage', on);
    return () => {
      window.removeEventListener(EVENT, on);
      window.removeEventListener('storage', on);
    };
  }, []);
  return [theme, setTheme];
}
