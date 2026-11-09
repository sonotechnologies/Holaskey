import type { Metadata } from 'next';
import Link from 'next/link';
import { MeasureDiagram } from '@/components/MeasureFields';

export const metadata: Metadata = { title: 'Size guide', description: "HOLASKEY men's clothing and shoe size charts.", alternates: { canonical: '/size-guide' } };

const TOPS = [
  ['XS', '86–91', '71–76', '42'],
  ['S', '91–97', '76–81', '44'],
  ['M', '97–102', '81–86', '46'],
  ['L', '102–109', '86–94', '48'],
  ['XL', '109–117', '94–102', '50'],
  ['XXL', '117–124', '102–110', '52'],
];
const SHOES = [
  ['39', '6', '24.6'],
  ['40', '6.5', '25.3'],
  ['41', '7.5', '26.0'],
  ['42', '8', '26.7'],
  ['43', '9', '27.3'],
  ['44', '9.5', '28.0'],
  ['45', '10.5', '28.7'],
  ['46', '11', '29.3'],
];

function Table({ head, rows, caption }: { head: string[]; rows: string[][]; caption: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-[15px]">
        <caption className="label mb-3 text-left text-muted">{caption}</caption>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="label border-b border-line py-3 pr-4 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              {r.map((c, i) => (i === 0 ? <th key={i} scope="row" className="border-b border-line py-3 pr-4 text-left font-mono text-[13px] font-medium">{c}</th> : <td key={i} className="border-b border-line py-3 pr-4">{c}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SizeGuide() {
  return (
    <main className="wrap pb-16 pt-8 lg:pb-24 lg:pt-12 animate-rise">
      <h1 className="h1 mb-3">Size guide</h1>
      <p className="mb-10 max-w-[60ch] text-muted">Our pieces are cut for a sharp fit. Between sizes? Size up for a boxier look, or send us your measurements and we&apos;ll make it to fit.</p>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-12">
          <Table caption="Shirts, tees, polos and jackets (cm)" head={['Size', 'Chest', 'Waist', 'Shoulder']} rows={TOPS} />
          <Table caption="Trousers, cargos and denim (cm)" head={['Size', 'Waist', 'Hips', 'Inseam']} rows={TOPS.map(([s, , w]) => [s, w, String(Number(w.split('–')[0]) + 16) + '–' + String(Number(w.split('–')[1]) + 16), '81'])} />
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
