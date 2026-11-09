import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSettings } from '@/lib/catalog';
import { naira } from '@/lib/format';

const POLICIES: Record<string, { title: string; body: (fee: string) => string[] }> = {
  delivery: {
    title: 'Delivery',
    body: (fee) => [
      `We deliver anywhere in Nigeria for one flat fee of ${fee}.`,
      'Lagos: 1–2 working days. Everywhere else: 3–5 working days. You’ll get a WhatsApp message and an email when your order ships, with tracking where available.',
      'Custom pieces ship when they’re finished; your quote shows the lead time.',
    ],
  },
  returns: {
    title: 'Returns',
    body: () => [
      'Unworn ready-made pieces with their tags can be returned within 7 days of delivery for an exchange or store credit. Message us on WhatsApp with your order number to arrange it.',
      'Custom pieces are made to your measurements and can’t be returned. If anything is faulty, tell us within 7 days and we’ll fix or remake it.',
      'If an item sells out before your payment is confirmed, we refund you in full or offer a swap.',
    ],
  },
  privacy: {
    title: 'Privacy',
    body: () => [
      'We collect your name, email, phone, delivery addresses, measurements and the photos you send for custom orders, only to run your orders.',
      'Reference photos are stored privately and are visible only to you and the HOLASKEY team. Payments are handled by Paystack; we never see or store your card details.',
      'Ask us on WhatsApp or by email to see or delete your data at any time.',
    ],
  },
  terms: {
    title: 'Terms',
    body: () => [
      'Prices are in Nigerian Naira and include VAT where applicable. An order is confirmed only when Paystack confirms payment.',
      'Custom quotes are valid for the period shown on the quote. Once a custom order is paid, production starts and the order can’t be cancelled.',
      'Product photos are as accurate as we can make them; colours may vary slightly between screens.',
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = POLICIES[params.slug];
  return p ? { title: p.title, alternates: { canonical: `/policies/${params.slug}` } } : { title: 'Not found' };
}

export default async function Policy({ params }: { params: { slug: string } }) {
  const p = POLICIES[params.slug];
  if (!p) notFound();
  const s = await getSettings();
  return (
    <main className="wrap pb-16 pt-8 lg:pb-24 lg:pt-12 animate-rise">
      <p className="label mb-2 text-muted">Policies</p>
      <h1 className="h1 mb-8">{p.title}</h1>
      <div className="flex max-w-[64ch] flex-col gap-4">
        {p.body(naira(s.delivery_fee)).map((t, i) => (
          <p key={i}>{t}</p>
        ))}
      </div>
    </main>
  );
}
