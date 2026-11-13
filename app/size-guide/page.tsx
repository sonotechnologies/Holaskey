import type { Metadata } from 'next';
import Link from 'next/link';
import { MeasureDiagram } from '@/components/MeasureFields';
import { shareMeta } from '@/lib/og';
import { BOTTOMS, SHOES, SizeTable as Table, TOPS } from '@/components/SizeCharts';

const DESCRIPTION = "Men's clothing and shoe size charts — or send your measurements and we'll make it to fit.";
export const metadata: Metadata = {
  title: 'Size guide',
  description: DESCRIPTION,
  alternates: { canonical: '/size-guide' },
  ...shareMeta({ title: 'Size guide · HOLASKEY', description: DESCRIPTION, path: '/size-guide', image: '/og?p=size-guide', alt: 'HOLASKEY size guide' }),
};

export default function SizeGuide() {
  return (
    <main className="wrap pb-16 pt-8 lg:pb-24 lg:pt-12 animate-rise">
      <h1 className="h1 mb-3">Size guide</h1>
      <p className="mb-10 max-w-[60ch] text-muted">Our pieces are cut for a sharp fit. Between sizes? Size up for a boxier look, or send us your measurements and we&apos;ll make it to fit.</p>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-12">
          <Table caption="Shirts, tees, polos and jackets (cm)" head={['Size', 'Chest', 'Waist', 'Shoulder']} rows={TOPS} />
          <Table caption="Trousers, cargos and denim (cm)" head={['Size', 'Waist', 'Hips', 'Inseam']} rows={BOTTOMS} />
          <Table caption="Shoes" head={['EU', 'UK', 'Foot length (cm)']} rows={SHOES} />
        </div>
        <aside className="flex flex-col gap-4 bg-smoke p-5">
          <h2 className="label">How to measure</h2>
          <MeasureDiagram active={null} />
          <p className="text-sm text-muted">Measure over a thin layer with the tape snug, not tight. For shoes, stand on paper with your heel against a wall and measure to your longest toe.</p>
          <Link href="/custom" className="btn-secondary">
            Get it made to measure
          </Link>
        </aside>
      </div>
    </main>
  );
}
