'use client';
import { useState } from 'react';
import { MEAS_FIELDS } from '@/lib/measure';
import type { Measurements } from '@/lib/types';

type Unit = 'cm' | 'in';
const conv = (v: string, to: Unit) => {
  const n = parseFloat(v);
  if (Number.isNaN(n)) return v;
  return String(Math.round((to === 'in' ? n / 2.54 : n * 2.54) * 10) / 10);
};

export function UnitToggle({ unit, onChange }: { unit: Unit; onChange: (u: Unit) => void }) {
  return (
    <div role="group" aria-label="Units" className="flex border border-line">
      {(['cm', 'in'] as const).map((u) => (
        <button key={u} type="button" aria-pressed={unit === u} onClick={() => onChange(u)} className={`label h-10 min-w-[52px] px-3 ${unit === u ? 'bg-ink text-bg' : 'text-ink'}`}>
          {u}
        </button>
      ))}
    </div>
  );
}

/** Clothing measurements: two-column grid + line diagram, cm/in toggle. Values submit in the chosen unit with a hidden "unit". */
export function ClothingMeasureFields({ initial, fromProfile }: { initial: Partial<Measurements> | null; fromProfile?: boolean }) {
  const [unit, setUnit] = useState<Unit>('cm');
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(MEAS_FIELDS.map((f) => [f.key, initial?.[f.key] != null ? String(initial[f.key]) : ''])),
  );
  const [focus, setFocus] = useState<string | null>(null);
  const switchUnit = (u: Unit) => {
    if (u === unit) return;
    setVals((v) => Object.fromEntries(Object.entries(v).map(([k, x]) => [k, conv(x, u)])));
    setUnit(u);
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {fromProfile ? (
          <span className="label flex items-center gap-2 text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-muted" aria-hidden />
            From your profile
          </span>
        ) : (
          <span />
        )}
        <UnitToggle unit={unit} onChange={switchUnit} />
      </div>
      <input type="hidden" name="unit" value={unit} />
      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
        <div className="grid grid-cols-2 gap-4">
          {MEAS_FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col">
              <label htmlFor={`m-${f.key}`} className="field-label">
                {f.label}
              </label>
              <div className="relative">
                <input
                  id={`m-${f.key}`}
                  name={f.key}
                  inputMode="decimal"
                  value={vals[f.key]}
                  onChange={(e) => setVals({ ...vals, [f.key]: e.target.value.replace(/[^\d.]/g, '') })}
                  onFocus={() => setFocus(f.key)}
                  onBlur={() => setFocus(null)}
                  aria-describedby={`m-${f.key}-how`}
                  className="field pr-11"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">{unit}</span>
              </div>
              <span id={`m-${f.key}-how`} className="sr-only">
                {f.how}
              </span>
            </div>
          ))}
        </div>
        <figure className="flex flex-col gap-3 bg-smoke p-4">
          <MeasureDiagram active={focus} />
          <figcaption className="text-sm text-muted">
            {focus ? MEAS_FIELDS.find((f) => f.key === focus)?.how : 'Measure over a thin layer, tape snug but not tight. Tap a field to see where.'}
          </figcaption>
        </figure>
      </div>
    </div>
  );
}

/** Simple line figure of a man with the seven measuring lines. The focused one is drawn in terracotta. */
export function MeasureDiagram({ active }: { active: string | null }) {
  const c = (k: string) => (active === k ? 'rgb(var(--hk-accent))' : 'rgb(var(--hk-muted))');
  const w = (k: string) => (active === k ? 2.5 : 1.25);
  return (
    <svg viewBox="0 0 200 300" role="img" aria-label="Where to measure" className="mx-auto h-auto w-full max-w-[240px]">
      <g fill="none" stroke="rgb(var(--hk-ink))" strokeWidth="1.25" strokeLinejoin="round">
        <circle cx="100" cy="28" r="16" />
        <path d="M92 44 L92 52 M108 44 L108 52" />
        {/* torso */}
        <path d="M64 58 L136 58 L132 150 L68 150 Z" />
        {/* arms */}
        <path d="M64 58 L48 140 L56 142 L72 80" />
        <path d="M136 58 L152 140 L144 142 L128 80" />
        {/* legs */}
        <path d="M68 150 L72 284 L94 284 L100 170 L106 284 L128 284 L132 150" />
      </g>
      <g strokeDasharray="4 3" fill="none">
        <line x1="62" y1="82" x2="138" y2="82" stroke={c('chest')} strokeWidth={w('chest')} />
        <line x1="66" y1="118" x2="134" y2="118" stroke={c('waist')} strokeWidth={w('waist')} />
        <line x1="66" y1="146" x2="134" y2="146" stroke={c('hips')} strokeWidth={w('hips')} />
        <line x1="64" y1="56" x2="136" y2="56" stroke={c('shoulder')} strokeWidth={w('shoulder')} />
        <line x1="138" y1="60" x2="152" y2="138" stroke={c('sleeve')} strokeWidth={w('sleeve')} />
        <line x1="100" y1="54" x2="100" y2="150" stroke={c('length')} strokeWidth={w('length')} />
        <line x1="103" y1="172" x2="112" y2="282" stroke={c('inseam')} strokeWidth={w('inseam')} />
      </g>
      <g fontFamily="var(--font-plex), monospace" fontSize="8" letterSpacing="1" fill="rgb(var(--hk-muted))">
        <text x="4" y="85" fill={c('chest')}>CHEST</text>
        <text x="4" y="121" fill={c('waist')}>WAIST</text>
        <text x="4" y="149" fill={c('hips')}>HIPS</text>
        <text x="4" y="59" fill={c('shoulder')}>SHOULDER</text>
        <text x="156" y="104" fill={c('sleeve')}>SLEEVE</text>
        <text x="104" y="104" fill={c('length')}>LENGTH</text>
        <text x="116" y="230" fill={c('inseam')}>INSEAM</text>
      </g>
    </svg>
  );
}

export const EU_SIZES = ['39', '40', '41', '42', '43', '44', '45', '46', '47'];
export const UK_SIZES = ['5', '6', '7', '8', '9', '10', '11', '12', '13'];

/** Shoe size chips (EU/UK) + foot length. */
export function ShoeFields({ initial, fromProfile }: { initial: Partial<Measurements> | null; fromProfile?: boolean }) {
  const [system, setSystem] = useState<'EU' | 'UK'>(initial?.shoe_system ?? 'EU');
  const [size, setSize] = useState<string | null>(initial?.shoe_size ?? null);
  const [unit, setUnit] = useState<Unit>('cm');
  const [foot, setFoot] = useState(initial?.foot_length_cm != null ? String(initial.foot_length_cm) : '');
  const list = system === 'EU' ? EU_SIZES : UK_SIZES;
  return (
    <div className="flex flex-col gap-5">
      {fromProfile && (
        <span className="label flex items-center gap-2 text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-muted" aria-hidden />
          From your profile
        </span>
      )}
      <input type="hidden" name="shoe_system" value={system} />
      <input type="hidden" name="shoe_size" value={size ?? ''} />
      <input type="hidden" name="foot_unit" value={unit} />
      <fieldset className="flex flex-col gap-3">
        <legend className="field-label">Shoe size</legend>
        <div className="flex gap-2">
          {(['EU', 'UK'] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={system === s}
              onClick={() => {
                setSystem(s);
                setSize(null);
              }}
              className={`label h-11 min-w-[56px] border px-3 ${system === s ? 'border-accent bg-espresso text-accent' : 'border-line text-muted'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="grid max-w-[560px] grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-2">
          {list.map((z) => (
            <button key={z} type="button" aria-pressed={size === z} onClick={() => setSize(z)} className={`h-12 border font-mono text-[13px] font-medium ${size === z ? 'border-ink bg-ink text-bg' : 'border-line hover:border-ink'}`}>
              {z}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex max-w-[360px] items-end gap-3">
        <div className="flex flex-1 flex-col">
          <label htmlFor="foot_length" className="field-label">
            Foot length
          </label>
          <div className="relative">
            <input id="foot_length" name="foot_length" inputMode="decimal" value={foot} onChange={(e) => setFoot(e.target.value.replace(/[^\d.]/g, ''))} className="field pr-11" />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">{unit}</span>
          </div>
        </div>
        <UnitToggle
          unit={unit}
          onChange={(u) => {
            if (u !== unit) {
              setFoot(conv(foot, u));
              setUnit(u);
            }
          }}
        />
      </div>
      <p className="text-sm text-muted">Stand on paper, heel against a wall, and measure to the tip of your longest toe.</p>
    </div>
  );
}
