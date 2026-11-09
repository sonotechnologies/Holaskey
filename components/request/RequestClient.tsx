'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { askQuestion, cancelCustom, sendQuote, setCustomStatus } from '@/app/actions/admin';
import { declineQuote, payQuote, sendCustomMessage } from '@/app/actions/custom';
import { FormError, FormNote } from '@/components/Field';
import { CameraIcon, CloseIcon } from '@/components/icons';
import { PhotoUploader, type UploadedPhoto } from '@/components/PhotoUploader';
import { CUSTOM_STATUS_LABEL, formatDate, formatDateTime } from '@/lib/format';
import type { RequestImage, RequestMessage } from '@/lib/requests';
import type { CustomStatus } from '@/lib/types';

/** Reference photos: tap to enlarge (lightbox with prev/next); admins get a download link. */
export function RefGallery({ images, columns, downloads }: { images: RequestImage[]; columns: number; downloads?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((i) => ((i ?? 0) + 1) % images.length);
      if (e.key === 'ArrowLeft') setOpen((i) => ((i ?? 0) - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, images.length]);
  if (!images.length) return <p className="text-sm text-muted">No photos.</p>;
  const cur = open !== null ? images[open] : null;
  return (
    <>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {images.map((img, i) => (
          <div key={img.id} className="flex flex-col gap-1.5">
            <button type="button" onClick={() => setOpen(i)} aria-label={`Enlarge photo ${i + 1}${img.note ? `: ${img.note}` : ''}`} className="relative aspect-[4/5] cursor-zoom-in overflow-hidden bg-smoke">
              {img.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.url} alt={img.note || `Reference photo ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <span className="label-sm text-muted">Photo {i + 1}</span>
              )}
            </button>
            {img.note && <span className="text-[13px] text-muted">“{img.note}”</span>}
            {downloads && img.url && (
              <a href={`${img.url}&download=`} className="label-sm underline underline-offset-[3px]">
                Download
              </a>
            )}
          </div>
        ))}
      </div>
      {cur && (
        <div role="dialog" aria-modal="true" aria-label="Photo" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg/95 px-4 pb-6 pt-16">
          <button type="button" aria-label="Close" onClick={() => setOpen(null)} autoFocus className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center">
            <CloseIcon size={24} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {cur.url && <img src={cur.url} alt={cur.note || 'Reference photo'} className="max-h-[70vh] max-w-full object-contain" />}
          {cur.note && <p className="text-[15px]">“{cur.note}”</p>}
          {images.length > 1 && (
            <div className="flex gap-2">
              <button type="button" aria-label="Previous photo" onClick={() => setOpen(((open ?? 0) - 1 + images.length) % images.length)} className="h-12 w-12 border border-line">
                ←
              </button>
              <span className="flex items-center px-3 font-mono text-xs text-muted">
                {(open ?? 0) + 1} / {images.length}
              </span>
              <button type="button" aria-label="Next photo" onClick={() => setOpen(((open ?? 0) + 1) % images.length)} className="h-12 w-12 border border-line">
                →
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function QuoteActions({ id, total, validUntil }: { id: string; total: string; validUntil: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState('');
  const router = useRouter();
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await payQuote(id);
            if (r && !r.ok) setErr(r.error);
          })
        }
        className="btn-primary mt-1"
      >
        {pending ? 'Opening Paystack…' : `Pay now · ${total}`}
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            confirm('Decline this quote?') &&
            start(async () => {
              const r = await declineQuote(id);
              if (!r.ok) setErr(r.error);
              router.refresh();
            })
          }
          className="link h-11"
        >
          Decline
        </button>
        <span className="text-[13px] text-muted">Quote valid until {validUntil}</span>
      </div>
      {err && <FormError>{err}</FormError>}
    </div>
  );
}

/** Chat-style thread; both sides can attach photos (owner's become progress shots). */
export function MessageThread({ id, ownerId, admin, messages, closed }: { id: string; ownerId: string; admin: boolean; messages: RequestMessage[]; closed: boolean }) {
  const [draft, setDraft] = useState('');
  const [attach, setAttach] = useState(false);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();
  const folder = useMemo(() => `${id}`, [id]);
  const uploading = photos.some((p) => !p.path && !p.error);

  const send = () =>
    start(async () => {
      setErr('');
      const r = await sendCustomMessage(id, draft, photos.filter((p) => p.path).map((p) => p.path!));
      if (!r.ok) return setErr(r.error);
      setDraft('');
      setPhotos([]);
      setAttach(false);
      router.refresh();
    });

  return (
    <section className="flex w-full max-w-[880px] flex-col gap-4">
      <h2 className="h2">Messages</h2>
      <ul className="flex flex-col gap-3">
        {messages.length === 0 && <li className="text-sm text-muted">No messages yet.</li>}
        {messages.map((m) => {
          const mine = admin ? m.fromAdmin : !m.fromAdmin;
          return (
            <li key={m.id} className={`flex max-w-[min(520px,88%)] flex-col gap-1.5 border border-line px-4 py-3.5 ${mine ? 'self-end bg-espresso' : 'self-start bg-smoke'}`}>
              <span className="label-sm text-muted">
                {m.fromAdmin ? 'HOLASKEY' : admin ? 'Customer' : 'You'} · {formatDateTime(m.createdAt)}
              </span>
              {m.body && <p className="whitespace-pre-line text-[15px]">{m.body}</p>}
              {m.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {m.images.map((img, i) =>
                    img.url ? (
                      <a key={i} href={img.url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={m.fromAdmin ? 'Progress shot' : 'Photo from the customer'} className="aspect-[4/5] w-40 bg-bg object-cover" loading="lazy" />
                      </a>
                    ) : null,
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {!closed && (
        <>
          {attach && <PhotoUploader userId={ownerId} folder={folder} max={5} photos={photos} setPhotos={setPhotos} withNotes={false} compact />}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!uploading) send();
            }}
          >
            <button type="button" aria-label="Attach photo" aria-pressed={attach} onClick={() => setAttach(!attach)} className={`flex h-12 w-12 flex-none items-center justify-center border ${attach ? 'border-ink' : 'border-line'}`}>
              <CameraIcon size={20} />
            </button>
            <label htmlFor="msg" className="sr-only">
              Message
            </label>
            <input id="msg" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message" className="field flex-1" />
            <button type="submit" disabled={pending || uploading} className="btn-primary flex-none px-5">
              {pending ? '…' : 'Send'}
            </button>
          </form>
          {err && <FormError>{err}</FormError>}
        </>
      )}
    </section>
  );
}

const NEXT_STATUS: Partial<Record<CustomStatus, CustomStatus[]>> = {
  paid: ['in_production'],
  in_production: ['ready', 'shipped'],
  ready: ['shipped'],
  shipped: ['delivered'],
};

/** Admin: quote form in place of the quote card, question, production status, cancel. */
export function AdminPanel({
  id,
  status,
  quote,
  defaultExpiryDays,
  expiresAt,
  paystackRef,
}: {
  id: string;
  status: CustomStatus;
  quote: { amount: number | null; delivery: number | null; days: number | null; note: string | null };
  defaultExpiryDays: number;
  expiresAt: string | null;
  paystackRef: string | null;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();
  const [price, setPrice] = useState(quote.amount != null ? String(quote.amount / 100) : '');
  const [delivery, setDelivery] = useState(quote.delivery != null ? String(quote.delivery / 100) : '');
  const [days, setDays] = useState(quote.days != null ? String(quote.days) : '14');
  const [valid, setValid] = useState(String(defaultExpiryDays));
  const [note, setNote] = useState(quote.note ?? '');
  const [question, setQuestion] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [reason, setReason] = useState('');
  const canQuote = ['submitted', 'needs_info', 'quoted', 'expired', 'declined'].includes(status);
  const n = (v: string) => Number(v.replace(/[^\d.]/g, '')) || 0;
  const total = n(price) + n(delivery);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: r.message ?? 'Saved.' } : { ok: false, text: r.error ?? 'Something went wrong.' });
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-6 lg:sticky lg:top-24">
      {canQuote && (
        <form
          className="flex flex-col gap-4 border-t-2 border-accent bg-espresso p-6 lg:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => sendQuote(id, { price, delivery, days, valid, note }));
          }}
        >
          <span className="label">Admin · {status === 'quoted' ? 'Update quote' : 'Send quote'}</span>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['Price (₦)', price, setPrice, 'numeric'],
                ['Delivery (₦)', delivery, setDelivery, 'numeric'],
                ['Lead time (days)', days, setDays, 'numeric'],
                ['Valid for (days)', valid, setValid, 'numeric'],
              ] as const
            ).map(([label, v, set, mode]) => (
              <div key={label} className="flex flex-col">
                <label className="field-label" htmlFor={`q-${label}`}>
                  {label}
                </label>
                <input id={`q-${label}`} inputMode={mode} value={v} onChange={(e) => set(e.target.value)} className="field" />
              </div>
            ))}
          </div>
          <div className="flex flex-col">
            <label htmlFor="q-note" className="field-label">
              Note to customer
            </label>
            <textarea id="q-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="field resize-y text-[15px]" />
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-3.5">
            <span className="label">Customer pays</span>
            <span className="text-[22px] font-semibold">₦{total.toLocaleString('en-NG')}</span>
          </div>
          {status === 'quoted' && expiresAt && <p className="text-sm text-muted">Current quote valid until {formatDate(expiresAt)}.</p>}
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? 'Sending…' : status === 'quoted' ? 'Update quote' : 'Send quote'}
          </button>
        </form>
      )}

      {canQuote && (
        <form
          className="flex flex-col gap-3 bg-smoke p-6"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const r = await askQuestion(id, question);
              if (r.ok) setQuestion('');
              return r;
            });
          }}
        >
          <label htmlFor="q-question" className="label">
            Ask a question first
          </label>
          <textarea id="q-question" rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Should the collar be ribbed like the second photo?" className="field resize-y text-[15px]" />
          <button type="submit" disabled={pending || !question.trim()} className="btn-secondary">
            Send question
          </button>
        </form>
      )}

      {NEXT_STATUS[status] && (
        <div className="flex flex-col gap-3 border-t-2 border-accent bg-espresso p-6">
          <span className="label">Production · {CUSTOM_STATUS_LABEL[status]}</span>
          {paystackRef && <span className="font-mono text-xs text-muted">Paystack ref {paystackRef}</span>}
          <label htmlFor="s-note" className="sr-only">
            Note for the customer
          </label>
          <input id="s-note" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Optional note, e.g. tracking number" className="field" />
          <div className="flex flex-wrap gap-2">
            {NEXT_STATUS[status]!.map((to) => (
              <button key={to} type="button" disabled={pending} onClick={() => run(() => setCustomStatus(id, to, statusNote))} className="btn-primary">
                Mark {CUSTOM_STATUS_LABEL[to].toLowerCase()}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted">Attach progress photos in the message thread — they appear on the request.</p>
        </div>
      )}

      {canQuote && (
        <details className="bg-smoke p-6">
          <summary className="label cursor-pointer">Cancel request</summary>
          <div className="mt-4 flex flex-col gap-3">
            <label htmlFor="c-reason" className="field-label">
              Reason (sent to the customer)
            </label>
            <input id="c-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="field" />
            <button type="button" disabled={pending || !reason.trim()} onClick={() => run(() => cancelCustom(id, reason))} className="btn-secondary">
              Cancel request
            </button>
          </div>
        </details>
      )}
      {msg && (msg.ok ? <FormNote>{msg.text}</FormNote> : <FormError>{msg.text}</FormError>)}
    </div>
  );
}
