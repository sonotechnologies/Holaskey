export const TOPS = [
  ['XS', '86–91', '71–76', '42'],
  ['S', '91–97', '76–81', '44'],
  ['M', '97–102', '81–86', '46'],
  ['L', '102–109', '86–94', '48'],
  ['XL', '109–117', '94–102', '50'],
  ['XXL', '117–124', '102–110', '52'],
];
export const SHOES = [
  ['39', '6', '24.6'],
  ['40', '6.5', '25.3'],
  ['41', '7.5', '26.0'],
  ['42', '8', '26.7'],
  ['43', '9', '27.3'],
  ['44', '9.5', '28.0'],
  ['45', '10.5', '28.7'],
  ['46', '11', '29.3'],
];

export function SizeTable({ head, rows, caption }: { head: string[]; rows: string[][]; caption: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[300px] border-collapse text-[15px]">
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

export const BOTTOMS = TOPS.map(([s, , w]) => {
  const [a, b] = w.split('–').map(Number);
  return [s, w, `${a + 16}–${b + 16}`, '81'];
});
