'use client';
import { useFormStatus } from 'react-dom';

export function Submit({ children, pendingText, variant = 'primary', className = '', name, value }: { children: React.ReactNode; pendingText?: string; variant?: 'primary' | 'secondary'; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={`${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} ${className}`}>
      {pending ? pendingText ?? 'Working…' : children}
    </button>
  );
}
