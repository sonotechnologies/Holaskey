import type { Metadata } from 'next';
import { getSettings } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Contact', description: 'Reach HOLASKEY on WhatsApp or Instagram.', alternates: { canonical: '/contact' } };

export default async function Contact() {
  const s = await getSettings();
  const wa = s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, '')}` : null;
  return (
    <main className="wrap pb-16 pt-8 lg:pb-24 lg:pt-12 animate-rise">
      <h1 className="h1 mb-3">Contact</h1>
      <p className="mb-10 max-w-[60ch] text-muted">The fastest way to reach us is WhatsApp. We reply between 9am and 8pm, Monday to Saturday.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3 bg-espresso p-6">
          <h2 className="label">WhatsApp</h2>
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="text-xl font-medium">
              {s.whatsapp}
            </a>
          ) : (
            <p className="text-muted">Number coming soon.</p>
          )}
        </div>
        <div className="flex flex-col gap-3 bg-espresso p-6">
          <h2 className="label">Instagram</h2>
          <a href={s.instagram} target="_blank" rel="noopener noreferrer" className="text-xl font-medium">
            @shopwithholaskey
          </a>
        </div>
      </div>
    </main>
  );
}
