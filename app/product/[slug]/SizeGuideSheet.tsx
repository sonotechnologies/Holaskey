'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CloseIcon } from '@/components/icons';
import { Portal } from '@/components/Portal';
import { BOTTOMS, SHOES, SizeTable, TOPS } from '@/components/SizeCharts';

/** "Size guide" opens the relevant chart over the product page instead of navigating away. */
export function SizeGuideButton({ kind }: { kind: 'shoes' | 'tops' | 'bottoms' }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const chart =
    kind === 'shoes'
      ? { caption: 'Shoes', head: ['EU', 'UK', 'Foot length (cm)'], rows: SHOES, how: 'Stand on paper with your heel against a wall and measure to the tip of your longest toe.' }
      : kind === 'bottoms'
        ? { caption: 'Trousers, cargos and denim (cm)', head: ['Size', 'Waist', 'Hips', 'Inseam'], rows: BOTTOMS, how: 'Measure your natural waist and the widest part of your seat, tape snug but not tight.' }
        : { caption: 'Shirts, tees, polos and jackets (cm)', head: ['Size', 'Chest', 'Waist', 'Shoulder'], rows: TOPS, how: 'Measure around the fullest part of your chest, under the arms, over a thin layer.' };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="link">
        Size guide
      </button>
      {open && (
        <Portal>
          <div className="fixed inset-0 z-[65]" role="dialog" aria-modal="true" aria-label="Size guide">
            <button type="button" aria-label="Close" className="absolute inset-0 bg-bg/60" onClick={() => setOpen(false)} />
            <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col border-t border-line bg-bg animate-rise md:inset-y-0 md:left-auto md:max-h-none md:w-[480px] md:border-l md:border-t-0">
              <div className="flex h-14 flex-none items-center justify-between border-b border-line px-5">
                <span className="label">Size guide</span>
                <button type="button" aria-label="Close" autoFocus onClick={() => setOpen(false)} className="-mr-2.5 flex h-11 w-11 items-center justify-center">
                  <CloseIcon />
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-5">
                <SizeTable caption={chart.caption} head={chart.head} rows={chart.rows} />
                <p className="text-[15px] text-muted">{chart.how}</p>
                <p className="text-[15px]">Between sizes? Size up for a boxier fit — or send us your measurements and we’ll make it to fit.</p>
                <div className="flex flex-col gap-2">
                  <Link href="/custom" className="btn-secondary">
                    Get it made to measure
                  </Link>
                  <Link href="/size-guide" className="link self-center py-2">
                    Full size guide
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
