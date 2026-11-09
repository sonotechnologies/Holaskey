'use client';
import { useMemo, useState } from 'react';
import { useFormState } from 'react-dom';
import { submitCustomRequest } from '@/app/actions/custom';
import { FormError } from '@/components/Field';
import { ClothingMeasureFields, ShoeFields } from '@/components/MeasureFields';
import { PhotoUploader, type UploadedPhoto } from '@/components/PhotoUploader';
import { Submit } from '@/components/Submit';
import { CLOTHING_TYPES, SHOE_TYPES } from '@/lib/custom';
import { MAX_REFS } from '@/lib/images';
import { hasClothingMeasurements } from '@/lib/measure';
import type { Measurements } from '@/lib/types';

const STEPS = ['Item', 'Photos', 'Fit', 'Details'];

export function CustomForm({ userId, saved, product }: { userId: string; saved: Measurements | null; product: { slug: string; title: string; kind: 'clothing' | 'shoes' } | null }) {
  const requestId = useMemo(() => crypto.randomUUID(), []);
  const [step, setStep] = useState(1);
  const [kind, setKind] = useState<'clothing' | 'shoes' | null>(product?.kind ?? null);
  const [itemType, setItemType] = useState<string | null>(null);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [desc, setDesc] = useState(product ? `Like the ${product.title}, but ` : '');
  const [err, setErr] = useState('');
  const [state, action] = useFormState(submitCustomRequest, null);

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }, []);
  const uploading = photos.some((p) => !p.path && !p.error);
  const ready = photos.filter((p) => p.path);

  const next = () => {
    setErr('');
    if (step === 1 && !kind) return setErr('Choose clothing or shoes to continue.');
    if (step === 1 && !itemType) return setErr('Choose an item type to continue.');
    if (step === 2 && uploading) return setErr('Wait for your photos to finish uploading.');
    if (step === 2 && !ready.length) return setErr('Add at least one photo of what you want.');
    setStep(step + 1);
    document.getElementById('request')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <form action={action} className="flex flex-col gap-8" noValidate>
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="kind" value={kind ?? ''} />
      <input type="hidden" name="item_type" value={itemType ?? ''} />
      <input type="hidden" name="photos" value={JSON.stringify(ready.map((p) => ({ path: p.path, note: p.note })))} />
      {product && <input type="hidden" name="product_slug" value={product.slug} />}

      <ol className="label flex flex-wrap gap-x-8 gap-y-3" aria-label="Steps">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i + 1 === step ? 'step' : undefined}
            className={`border-b-2 pb-2 ${i + 1 === step ? 'border-accent text-ink' : i + 1 < step ? 'border-muted text-muted' : 'border-transparent text-muted'}`}
          >
            0{i + 1} {label}
          </li>
        ))}
      </ol>

      {/* 01 Item */}
      <div className={step === 1 ? 'flex flex-col gap-6' : 'hidden'}>
        <h2 className="h2">What are we making?</h2>
        {product && (
          <p className="text-[15px]">
            Based on <b>{product.title}</b>.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 lg:gap-6">
          {(
            [
              ['clothing', 'Clothing', '/img/hk-935966.jpg'],
              ['shoes', 'Shoes', '/img/hk-12628400.jpg'],
            ] as const
          ).map(([k, label, img]) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => {
                if (kind !== k) setItemType(null);
                setKind(k);
                setErr('');
              }}
              className={`flex flex-col border bg-bg text-left ${kind === k ? 'border-ink' : 'border-line hover:border-muted'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <span className="flex w-full items-center justify-between gap-2 p-4">
                <span className="font-display text-lg font-bold uppercase lg:text-2xl">{label}</span>
                {kind === k && <span className="label-sm text-accent">Selected</span>}
              </span>
            </button>
          ))}
        </div>
        {kind && (
          <fieldset className="flex flex-col gap-3">
            <legend className="label mb-3">Item type</legend>
            <div className="flex flex-wrap gap-2">
              {(kind === 'shoes' ? SHOE_TYPES : CLOTHING_TYPES).map((t) => (
                <button key={t} type="button" aria-pressed={itemType === t} onClick={() => setItemType(t)} className={`chip px-4 tracking-[0.08em] ${itemType === t ? 'chip-on' : ''}`}>
                  {t}
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      {/* 02 Photos — the main step */}
      <div className={step === 2 ? 'flex flex-col gap-6' : 'hidden'}>
        <h2 className="h2">Show us the look</h2>
        <PhotoUploader userId={userId} folder={requestId} max={MAX_REFS} photos={photos} setPhotos={setPhotos} />
        <p className="text-sm text-muted">Your note under each photo tells us what to copy — and describes the photo for screen readers.</p>
      </div>

      {/* 03 Fit */}
      <div className={step === 3 ? 'flex flex-col gap-6' : 'hidden'}>
        <h2 className="h2">Your fit</h2>
        {kind === 'shoes' ? (
          <ShoeFields initial={saved} fromProfile={!!saved?.shoe_size} />
        ) : (
          <ClothingMeasureFields initial={saved} fromProfile={hasClothingMeasurements(saved)} />
        )}
        <label className="flex items-center gap-3 text-[15px]">
          <input type="checkbox" name="save_measurements" defaultChecked className="h-5 w-5 accent-[rgb(var(--hk-accent))]" />
          Save these to my profile
        </label>
      </div>

      {/* 04 Details */}
      <div className={step === 4 ? 'flex flex-col gap-6' : 'hidden'}>
        <h2 className="h2">The details</h2>
        <div className="flex flex-col">
          <label htmlFor="c-desc" className="field-label">
            Description
          </label>
          <textarea
            id="c-desc"
            name="description"
            rows={4}
            maxLength={1000}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Boxy fit, dropped shoulder, same collar as the photo"
            className="field resize-y"
            aria-describedby="c-desc-count"
          />
          <span id="c-desc-count" className="mt-1.5 self-end font-mono text-xs text-muted">
            {desc.length} / 1,000
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col sm:col-span-2 lg:col-span-1">
            <label htmlFor="c-mat" className="field-label">
              Colour / material
            </label>
            <input id="c-mat" name="colour_material" placeholder="Black suede" className="field" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="c-bmin" className="field-label">
              Budget from (₦)
            </label>
            <input id="c-bmin" name="budget_min" inputMode="numeric" placeholder="150,000" className="field" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="c-bmax" className="field-label">
              Budget to (₦)
            </label>
            <input id="c-bmax" name="budget_max" inputMode="numeric" placeholder="250,000" className="field" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="c-date" className="field-label">
              Needed by
            </label>
            <input id="c-date" type="date" name="needed_by" min={minDate} className="field" />
          </div>
        </div>
        <div className="flex flex-col gap-4 border-t border-line pt-6">
          <span className="label text-muted">Review</span>
          {[
            ['Item', `${kind === 'shoes' ? 'Shoes' : kind === 'clothing' ? 'Clothing' : '—'} · ${itemType ?? '—'}`, 1],
            ['Photos', `${ready.length} added`, 2],
            ['Fit', kind === 'shoes' ? 'Shoe size and foot length' : 'Body measurements', 3],
          ].map(([k, v, s]) => (
            <div key={k as string} className="grid grid-cols-[minmax(80px,120px)_minmax(0,1fr)_auto] items-baseline gap-4 text-[15px]">
              <span className="label">{k}</span>
              <span>{v}</span>
              <button type="button" className="link" onClick={() => setStep(s as number)}>
                Edit
              </button>
            </div>
          ))}
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {ready.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.key} src={p.preview} alt={p.note || 'Reference photo'} className="aspect-[4/5] w-[72px] flex-none bg-smoke object-cover" />
            ))}
          </div>
        </div>
      </div>

      {(err || (state && !state.ok)) && <FormError>{err || (state && !state.ok ? state.error : '')}</FormError>}

      <div className="flex justify-between gap-3 border-t border-line pt-6">
        <button type="button" onClick={() => setStep(Math.max(1, step - 1))} className={`btn-secondary px-6 ${step === 1 ? 'invisible' : ''}`}>
          Back
        </button>
        {step < 4 ? (
          <button type="button" onClick={next} className="btn-primary">
            Continue
          </button>
        ) : (
          <Submit pendingText="Sending…">Submit request</Submit>
        )}
      </div>
    </form>
  );
}
