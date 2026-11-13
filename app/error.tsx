'use client';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="wrap flex flex-col items-start gap-6 py-24 lg:py-32">
      <p className="label text-muted">Something went wrong</p>
      <h1 className="display">Give it a second.</h1>
      <p className="max-w-[52ch]">This page didn&apos;t load properly. Try again — and if it keeps happening, message us on WhatsApp and we&apos;ll sort it.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-secondary">
          Back to home
        </Link>
      </div>
      {error.digest && <p className="font-mono text-xs text-muted">Ref {error.digest}</p>}
    </main>
  );
}
