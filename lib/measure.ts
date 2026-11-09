import { z } from 'zod';
import type { Measurements } from './types';

const num = z.preprocess((x) => (x === '' || x === null || x === undefined ? null : Number(x)), z.number().positive().max(400).nullable());

export const MEAS_KEYS = ['chest', 'waist', 'hips', 'shoulder', 'sleeve', 'length', 'inseam'] as const;

/** Reads measurement fields (entered in cm or inches) and returns cm values. */
export function parseMeasurements(form: FormData): Measurements {
  const read = (key: string, factor: number) => {
    const r = num.safeParse(form.get(key));
    return r.success && r.data !== null ? Math.round(r.data * factor * 10) / 10 : null;
  };
  const f = form.get('unit') === 'in' ? 2.54 : 1;
  const ff = form.get('foot_unit') === 'in' ? 2.54 : 1;
  const sys = form.get('shoe_system');
  return {
    chest: read('chest', f),
    waist: read('waist', f),
    hips: read('hips', f),
    shoulder: read('shoulder', f),
    sleeve: read('sleeve', f),
    length: read('length', f),
    inseam: read('inseam', f),
    foot_length_cm: read('foot_length', ff),
    shoe_system: sys === 'UK' ? 'UK' : sys === 'EU' ? 'EU' : null,
    shoe_size: String(form.get('shoe_size') || '') || null,
  };
}


export const MEAS_FIELDS: { key: (typeof MEAS_KEYS)[number]; label: string; how: string }[] = [
  { key: 'chest', label: 'Chest', how: 'Around the fullest part of the chest, under the arms.' },
  { key: 'waist', label: 'Waist', how: 'Around your natural waist, above the hip bones.' },
  { key: 'hips', label: 'Hips', how: 'Around the widest part of the seat.' },
  { key: 'shoulder', label: 'Shoulder', how: 'Across the back, shoulder point to shoulder point.' },
  { key: 'sleeve', label: 'Sleeve', how: 'Shoulder point down to the wrist bone, arm relaxed.' },
  { key: 'length', label: 'Length', how: 'Base of the collar at the back down to where the top should end.' },
  { key: 'inseam', label: 'Inseam', how: 'Crotch seam down the inside leg to the ankle.' },
];

export function hasClothingMeasurements(m: Partial<Measurements> | null | undefined) {
  return !!m && MEAS_KEYS.some((k) => m[k] != null);
}
