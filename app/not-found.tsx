import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="wrap flex flex-col items-start gap-6 py-24 lg:py-32">
      <p className="label text-muted">404</p>
      <h1 className="display">Not here.</h1>
      <p>That page moved or never existed.</p>
      <Link href="/shop" className="btn-primary">
        Back to the shop
      </Link>
    </main>
  );
}
