'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Section reveal: 16 px rise + fade, 400 ms ease-out, once, when scrolled into view.
 * Content is only hidden once JS runs (html.js), and anything already scrolled past is shown,
 * so jumps, anchors and no-JS never leave a section blank.
 */
export function Reveal({ children, className = '', as: Tag = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'div' }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.95) {
        setShown(true);
        return true;
      }
      return false;
    };
    if (check()) return;
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(() => check() && cleanup()) : null;
    io?.observe(el);
    const onScroll = () => check() && cleanup();
    window.addEventListener('scroll', onScroll, { passive: true });
    function cleanup() {
      io?.disconnect();
      window.removeEventListener('scroll', onScroll);
    }
    return cleanup;
  }, []);
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} data-reveal={shown ? 'in' : 'wait'} className={`${className} ${shown ? 'animate-rise' : ''}`}>
      {children}
    </Tag>
  );
}
