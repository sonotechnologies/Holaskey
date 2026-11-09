import type { Metadata } from 'next';
import { getSettings } from '@/lib/catalog';
import { naira } from '@/lib/format';

export const metadata: Metadata = { title: 'FAQ', description: 'Delivery, returns, payment and custom orders at HOLASKEY.', alternates: { canonical: '/faq' } };

export default async function Faq() {
  const s = await getSettings();
  const qa: [string, string][] = [
    ['How much is delivery?', `One flat fee of ${naira(s.delivery_fee)} anywhere in Nigeria. Lagos orders arrive in 1–2 working days, everywhere else in 3–5.`],
    ['How do I pay?', 'Every order is paid online through Paystack: card, bank transfer or USSD. Your order is confirmed the moment Paystack confirms the payment.'],
    ['Can I return something?', 'Unworn ready-made pieces with tags can be returned within 7 days of delivery for an exchange or store credit. Custom pieces are made for you and can’t be returned, but we’ll fix any fault.'],
    ['How do custom orders work?', 'Send us photos of what you want with your measurements. We send a quote within 48 hours. Pay on the site and we start; you’ll see progress photos on your request.'],
    ['How long does a custom piece take?', 'Usually 10–21 days after payment, depending on the piece. Your quote shows the lead time.'],
    ['Do you ship outside Nigeria?', 'Not yet. We deliver anywhere in Nigeria.'],
  ];
  return (
    <main className="wrap pb-16 pt-8 lg:pb-24 lg:pt-12 animate-rise">
      <h1 className="h1 mb-8">FAQ</h1>
      <div className="max-w-[760px] border-t border-line">
        {qa.map(([q, a]) => (
          <details key={q} className="group border-b border-line">
            <summary className="label flex min-h-14 cursor-pointer list-none items-center justify-between gap-4">
              {q}
              <span className="text-lg group-open:hidden" aria-hidden>
                +
              </span>
              <span className="hidden text-lg group-open:inline" aria-hidden>
                −
              </span>
            </summary>
            <p className="mb-5 max-w-[60ch] text-[15px] text-muted">{a}</p>
          </details>
        ))}
      </div>
    </main>
  );
}
