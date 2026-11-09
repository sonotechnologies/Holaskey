import Image from 'next/image';
import Link from 'next/link';
import { getSettings } from '@/lib/catalog';
import { NewsletterForm, ThemeToggle } from './FooterClient';

const COLS = [
  {
    title: 'Shop',
    links: [
      ['New In', '/shop?new=1'],
      ['Shirts', '/shop?cat=shirts'],
      ['Jackets', '/shop?cat=jackets'],
      ['Sneakers', '/shop?cat=sneakers'],
      ['Custom', '/custom'],
    ],
  },
  {
    title: 'Help',
    links: [
      ['Delivery', '/policies/delivery'],
      ['Returns', '/policies/returns'],
      ['Size guide', '/size-guide'],
      ['FAQ', '/faq'],
      ['Contact', '/contact'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About', '/about'],
      ['Lookbook', '/lookbook'],
      ['Terms', '/policies/terms'],
      ['Privacy', '/policies/privacy'],
    ],
  },
];

export async function Footer() {
  const s = await getSettings();
  const wa = s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, '')}` : '/contact';
  return (
    <footer className="border-t border-line bg-espresso pb-8 pt-14 lg:pt-20">
      <div className="wrap grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          {/* Full signed wordmark: bone with the terracotta signature. */}
          <div className="relative w-[200px] pb-[30px]">
            <Image src="/wordmark-bone.png" alt="HOLASKEY" width={352} height={44} className="logo block h-auto w-[200px]" />
            <Image src="/signature.png" alt="" width={62} height={37} className="absolute -right-1.5 top-[22px] h-auto w-[62px]" />
          </div>
        </div>
        {COLS.map((col) => (
          <div key={col.title} className="flex flex-col gap-2.5">
            <h2 className="label mb-1 text-muted">{col.title}</h2>
            {col.links.map(([label, href]) => (
              <Link key={label} href={href} className="text-[15px]">
                {label}
              </Link>
            ))}
          </div>
        ))}
        <div className="flex flex-col gap-3">
          <h2 className="label text-muted">First to the drop</h2>
          <NewsletterForm />
          <div className="label flex gap-5">
            <a href={s.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href={wa} target={s.whatsapp ? '_blank' : undefined} rel="noopener noreferrer">
              WhatsApp
            </a>
          </div>
        </div>
      </div>
      <div className="wrap mt-12">
        <div className="label-sm flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5 text-muted">
          <span>© {new Date().getFullYear()} HOLASKEY · Lagos</span>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
