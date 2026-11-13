'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CloseIcon } from './icons';

export interface ToastInput {
  message: string;
  tone?: 'default' | 'error';
  action?: { label: string; href?: string; onClick?: () => void };
  duration?: number;
}
interface Toast extends ToastInput {
  id: number;
}

const EVENT = 'hk-toast';

/** Show a short message at the bottom of the screen. Safe to call from any client component. */
export function toast(input: ToastInput | string) {
  window.dispatchEvent(new CustomEvent<ToastInput>(EVENT, { detail: typeof input === 'string' ? { message: input } : input }));
}

export function Toaster() {
  const [list, setList] = useState<Toast[]>([]);
  const seq = useRef(0);
  useEffect(() => {
    const on = (e: Event) => {
      const t = { ...(e as CustomEvent<ToastInput>).detail, id: ++seq.current };
      setList((l) => [...l.slice(-2), t]);
      window.setTimeout(() => setList((l) => l.filter((x) => x.id !== t.id)), t.duration ?? (t.action ? 6000 : 3500));
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return (
    <div className="toaster pointer-events-none fixed inset-x-0 bottom-4 z-[55] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      {list.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex w-full max-w-[440px] items-center gap-3 border bg-espresso py-2 pl-4 pr-1 text-[15px] text-ink animate-rise ${t.tone === 'error' ? 'border-err' : 'border-line'}`}
        >
          {t.tone === 'error' && <span className="label text-err">Error</span>}
          <span className="min-w-0 flex-1 py-1.5">{t.message}</span>
          {t.action?.href && (
            <Link href={t.action.href} className="label flex-none px-2 underline underline-offset-4">
              {t.action.label}
            </Link>
          )}
          {t.action?.onClick && (
            <button
              type="button"
              onClick={() => {
                t.action!.onClick!();
                setList((l) => l.filter((x) => x.id !== t.id));
              }}
              className="label flex-none px-2 underline underline-offset-4"
            >
              {t.action.label}
            </button>
          )}
          <button type="button" aria-label="Dismiss" onClick={() => setList((l) => l.filter((x) => x.id !== t.id))} className="flex h-10 w-10 flex-none items-center justify-center text-muted hover:text-ink">
            <CloseIcon size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
