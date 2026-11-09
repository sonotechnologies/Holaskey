import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type Base = { label: string; hint?: ReactNode; suffix?: string; className?: string };

export function Field({ label, hint, suffix, className = '', id, ...input }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const fid = id ?? `f-${input.name}`;
  return (
    <div className={`flex min-w-0 flex-col ${className}`}>
      <label htmlFor={fid} className="field-label">
        {label}
      </label>
      <div className="relative">
        <input id={fid} {...input} className={`field ${suffix ? 'pr-12' : ''}`} />
        {suffix && <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">{suffix}</span>}
      </div>
      {hint && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function TextArea({ label, hint, className = '', id, ...input }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fid = id ?? `f-${input.name}`;
  return (
    <div className={`flex min-w-0 flex-col ${className}`}>
      <label htmlFor={fid} className="field-label">
        {label}
      </label>
      <textarea id={fid} {...input} className="field resize-y" />
      {hint && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function Select({ label, className = '', id, children, ...input }: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  const fid = id ?? `f-${input.name}`;
  return (
    <div className={`flex min-w-0 flex-col ${className}`}>
      <label htmlFor={fid} className="field-label">
        {label}
      </label>
      <select id={fid} {...input} className="field">
        {children}
      </select>
    </div>
  );
}

/** Errors in words, with a mono ERROR label (never colour alone). */
export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="flex items-baseline gap-2 text-[15px]">
      <span className="label text-err">Error</span>
      <span>{children}</span>
    </p>
  );
}

export function FormNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="status" className="flex items-baseline gap-2 text-[15px]">
      <span className="label text-ok">Done</span>
      <span>{children}</span>
    </p>
  );
}
