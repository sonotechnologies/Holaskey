'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

const START = 'hk-nav-start';

/** Call before a programmatic router.push/replace to show the bar. */
export function startNavProgress() {
  window.dispatchEvent(new Event(START));
}

/**
 * Thin terracotta bar at the very top. Starts the moment an internal link is clicked
 * (or startNavProgress() is called) and completes when the new URL has rendered,
 * so every tap gets instant feedback even while the server is still working.
 */
function Bar() {
  const path = usePathname();
  const sp = useSearchParams();
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [pct, setPct] = useState(0);
  const timer = useRef<number>();
  const first = useRef(true);

  useEffect(() => {
    const begin = () => {
      window.clearInterval(timer.current);
      setState('loading');
      setPct(12);
      timer.current = window.setInterval(() => setPct((p) => (p < 85 ? p + (90 - p) * 0.12 : p)), 200);
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest('a');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      begin();
    };
    document.addEventListener('click', onClick, true);
    window.addEventListener(START, begin);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener(START, begin);
      window.clearInterval(timer.current);
    };
  }, []);

  // URL changed → the new page rendered: finish the bar.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.clearInterval(timer.current);
    setPct(100);
    setState('done');
    const t = window.setTimeout(() => {
      setState('idle');
      setPct(0);
    }, 300);
    return () => window.clearTimeout(t);
  }, [path, sp]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5"
      style={{ opacity: state === 'idle' ? 0 : 1, transition: state === 'done' ? 'opacity .3s ease .1s' : 'none' }}
    >
      <div className="h-full bg-accent transition-[width] duration-200 ease-out" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function NavProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
