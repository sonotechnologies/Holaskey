'use client';
import { useEffect, useState } from 'react';
import { ArrowUpIcon } from './icons';

/** Appears after scrolling down a long page. */
export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 1400);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <button
      type="button"
      aria-label="Back to top"
      tabIndex={show ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
      className={`back-to-top fixed bottom-5 right-4 z-20 flex h-12 w-12 items-center justify-center border border-line bg-bg text-ink transition-[opacity,transform] duration-200 hover:border-ink md:right-6 ${show ? 'opacity-100' : 'pointer-events-none translate-y-2 opacity-0'}`}
    >
      <ArrowUpIcon />
    </button>
  );
}
