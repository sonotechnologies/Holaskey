import Link from 'next/link';
import { Img } from '@/components/Img';

/** Split screen: outfit photo left, form right (stacked on mobile). */
export function AuthShell({ mode, next, children }: { mode: 'login' | 'signup' | 'reset'; next?: string; children: React.ReactNode }) {
  const q = next ? `?next=${encodeURIComponent(next)}` : '';
  return (
    <main className="grid animate-rise lg:grid-cols-2">
      <div className="relative min-h-[220px] bg-smoke lg:min-h-[760px]">
        <Img src="/img/hk-935966.jpg" alt="A man in a tailored suit against a plain studio wall" fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-cover object-[center_20%]" />
      </div>
      <div className="flex items-center justify-center px-4 py-10 md:px-8 lg:py-20">
        <div className="flex w-full max-w-[400px] flex-col gap-5">
          {mode !== 'reset' && (
            <div className="flex gap-8 border-b border-line">
              {(
                [
                  ['login', 'Log in', '/login'],
                  ['signup', 'Sign up', '/signup'],
                ] as const
              ).map(([k, label, href]) => (
                <Link
                  key={k}
                  href={href + q}
                  aria-current={mode === k ? 'page' : undefined}
                  className={`label -mb-px flex min-h-12 items-center border-b-2 hover:no-underline ${mode === k ? 'border-accent text-ink' : 'border-transparent text-muted'}`}
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
          {children}
        </div>
      </div>
    </main>
  );
}
