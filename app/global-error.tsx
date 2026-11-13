'use client';

/** Last-resort error page (the root layout itself failed), so it carries its own minimal styling. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en-NG">
      <body style={{ margin: 0, background: '#120D0A', color: '#F3ECE2', fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 24, padding: '0 24px', maxWidth: 640, margin: '0 auto' }}>
          <p style={{ fontFamily: 'monospace', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9C8F82' }}>HOLASKEY</p>
          <h1 style={{ fontSize: 48, lineHeight: 0.95, textTransform: 'uppercase', margin: 0 }}>We&apos;ll be right back.</h1>
          <button onClick={reset} style={{ height: 48, padding: '0 28px', background: '#F3ECE2', color: '#120D0A', border: 0, fontFamily: 'monospace', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
