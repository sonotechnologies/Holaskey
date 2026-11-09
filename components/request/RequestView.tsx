import Link from 'next/link';
import { Signature } from '@/components/Signature';
import { StatusTag, Tracker } from '@/components/Status';
import { CUSTOM_STATUS_LABEL, CUSTOM_TRACK_LABELS, customTrackIndex, displayPhone, formatDate, formatDateTime, naira } from '@/lib/format';
import type { LoadedRequest } from '@/lib/requests';
import { AdminPanel, MessageThread, QuoteActions, RefGallery } from './RequestClient';

const MEAS_LABEL: Record<string, string> = {
  chest: 'Chest',
  waist: 'Waist',
  hips: 'Hips',
  shoulder: 'Shoulder',
  sleeve: 'Sleeve',
  length: 'Length',
  inseam: 'Inseam',
};

export function RequestView({ r, mode, quoteExpiryDays }: { r: LoadedRequest; mode: 'customer' | 'admin'; quoteExpiryDays: number }) {
  const admin = mode === 'admin';
  const m = r.measurements;
  const fit =
    r.kind === 'shoes'
      ? [m.shoe_size ? `${m.shoe_system ?? 'EU'} ${m.shoe_size}` : null, m.foot_length_cm ? `foot ${m.foot_length_cm} cm` : null].filter(Boolean).join(' · ')
      : Object.keys(MEAS_LABEL)
          .filter((k) => m[k] != null)
          .map((k) => `${MEAS_LABEL[k]} ${m[k]}`)
          .join(' · ') + ' cm';
  const specs: [string, React.ReactNode][] = [
    ['Item', `${r.kind === 'shoes' ? 'Shoes' : 'Clothing'} · ${r.itemType}`],
    ['Description', r.description],
    ...(r.colourMaterial ? [['Colour / material', r.colourMaterial] as [string, string]] : []),
    ...(r.budgetMin || r.budgetMax
      ? [['Budget', [r.budgetMin && naira(r.budgetMin), r.budgetMax && naira(r.budgetMax)].filter(Boolean).join(' – ')] as [string, string]]
      : []),
    ...(r.neededBy ? [['Needed by', formatDate(r.neededBy)] as [string, string]] : []),
    ['Fit', fit || '—'],
    ...(r.product
      ? [
          [
            'Based on',
            <Link key="p" href={`/product/${r.product.slug}`} className="underline underline-offset-4">
              {r.product.title}
            </Link>,
          ] as [string, React.ReactNode],
        ]
      : []),
    ...(admin && r.customer
      ? [['Customer', `${r.customer.full_name || '—'} · ${r.customer.email}${r.customer.phone ? ' · ' + displayPhone(r.customer.phone) : ''}`] as [string, string]]
      : []),
  ];
  const total = (r.quote.amount ?? 0) + (r.quote.delivery ?? 0);
  const quoteVisible = r.quote.amount != null && ['quoted', 'declined', 'expired', 'paid', 'in_production', 'ready', 'shipped', 'delivered'].includes(r.status);
  const done = ['paid', 'in_production', 'ready', 'shipped', 'delivered'].includes(r.status);
  const references = r.images.filter((i) => i.kind === 'reference');
  const progress = r.images.filter((i) => i.kind === 'progress');

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href={admin ? '/admin/custom' : '/account/custom'} className="label text-muted">
          {admin ? '← Admin · All requests' : '← Account · Custom orders'}
        </Link>
        <div className="flex flex-wrap items-baseline gap-4">
          <h1 className="h1">{r.itemType}</h1>
          <span className="font-mono text-[13px] font-medium tracking-[0.08em] text-muted">{r.number}</span>
          <StatusTag status={r.status} label={CUSTOM_STATUS_LABEL[r.status]} />
        </div>
        <p className="text-sm text-muted">Sent {formatDate(r.createdAt)}</p>
      </div>

      {r.status === 'cancelled' ? (
        <p className="border-t-2 border-accent bg-espresso p-4 text-[15px]">Cancelled{r.cancelReason ? `: ${r.cancelReason}` : '.'}</p>
      ) : (
        <Tracker labels={CUSTOM_TRACK_LABELS} current={customTrackIndex(r.status)} minWidth={104} />
      )}

      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-6">
          <h2 className="label text-muted">Reference photos</h2>
          <RefGallery images={references} columns={admin ? 2 : 3} downloads={admin} />
          {progress.length > 0 && (
            <>
              <h2 className="label text-muted">Progress photos</h2>
              <RefGallery images={progress} columns={3} downloads={admin} />
            </>
          )}
          <dl className="border-t border-line">
            {specs.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[minmax(100px,160px)_minmax(0,1fr)] gap-4 border-b border-line py-3 text-[15px]">
                <dt className="label text-muted">{k}</dt>
                <dd className="whitespace-pre-line">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {admin ? (
          <AdminPanel
            id={r.id}
            status={r.status}
            quote={{ amount: r.quote.amount, delivery: r.quote.delivery, days: r.quote.days, note: r.quote.note }}
            defaultExpiryDays={quoteExpiryDays}
            expiresAt={r.quote.expiresAt}
            paystackRef={r.paystackRef}
          />
        ) : quoteVisible ? (
          <div className="flex flex-col gap-3.5 border-t-2 border-accent bg-espresso p-6 lg:sticky lg:top-24 lg:p-8">
            <div className="flex items-center justify-between gap-3">
              <span className="label">Your quote</span>
              <StatusTag status={r.status} label={CUSTOM_STATUS_LABEL[r.status]} />
            </div>
            <div className="flex justify-between">
              <span>Price</span>
              <span className="font-semibold">{naira(r.quote.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="font-semibold">{r.quote.delivery ? naira(r.quote.delivery) : 'Included'}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-3.5">
              <span className="label">Total</span>
              <span className="font-display text-[clamp(40px,3.6vw,52px)] font-extrabold leading-none [font-stretch:75%]">{naira(total)}</span>
            </div>
            {r.quote.days != null && (
              <div className="flex justify-between">
                <span>Lead time</span>
                <span className="font-semibold">{r.quote.days} days</span>
              </div>
            )}
            {r.quote.note && (
              <div className="flex flex-col gap-1.5 bg-smoke p-4 text-[15px]">
                <span className="label-sm text-muted">Note from HOLASKEY</span>
                <span className="whitespace-pre-line">{r.quote.note}</span>
              </div>
            )}
            {r.status === 'quoted' && <QuoteActions id={r.id} total={naira(total)} validUntil={formatDate(r.quote.expiresAt)} />}
            {r.status === 'declined' && <p className="text-[15px]">You declined this quote. Send us a message if you want changes.</p>}
            {r.status === 'expired' && <p className="text-[15px]">This quote expired. Send us a message and we&apos;ll re-quote.</p>}
            {done && (
              <>
                <p className="text-[15px]">Paid. We&apos;re making your piece and will post progress shots here.</p>
                <Signature />
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 border-t-2 border-accent bg-espresso p-6 lg:p-8">
            <span className="label">Your quote</span>
            <p className="text-[15px]">
              {r.status === 'needs_info' ? 'We have a question before we can quote. See the messages below.' : "We'll send your quote within 48 hours."}
            </p>
          </div>
        )}
      </div>

      <MessageThread id={r.id} ownerId={r.userId} admin={admin} messages={r.messages} closed={r.status === 'cancelled' || r.status === 'delivered'} />

      {r.events.length > 0 && (
        <section className="flex max-w-[880px] flex-col gap-3">
          <h2 className="label text-muted">Timeline</h2>
          <ul className="flex flex-col gap-2 text-[15px]">
            {r.events.map((e, i) => (
              <li key={i} className="flex gap-3">
                <span className="label-sm w-28 flex-none pt-0.5 text-muted">{formatDateTime(e.created_at)}</span>
                <span>
                  {CUSTOM_STATUS_LABEL[e.to_status as keyof typeof CUSTOM_STATUS_LABEL] ?? e.to_status}
                  {e.note ? ` — ${e.note}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
