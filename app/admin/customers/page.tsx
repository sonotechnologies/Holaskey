import { displayPhone, formatDate, naira } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Customers' };

const PAID = ['paid', 'paid_out_of_stock', 'processing', 'shipped', 'delivered'];
const KEYS = ['chest', 'waist', 'hips', 'shoulder', 'sleeve', 'length', 'inseam'] as const;

export default async function Customers({ searchParams }: { searchParams: { q?: string } }) {
  const db = createClient();
  const [{ data: profiles }, { data: orders }, { data: meas }] = await Promise.all([
    db.from('profiles').select('user_id, full_name, phone, email, role, created_at').order('created_at', { ascending: false }).limit(500),
    db.from('orders').select('user_id, total, refunded_at').in('status', PAID),
    db.from('measurements').select('*'),
  ]);
  const stats = new Map<string, { count: number; spent: number }>();
  (orders ?? []).forEach((o) => {
    if (o.refunded_at) return;
    const s = stats.get(o.user_id) ?? { count: 0, spent: 0 };
    s.count++;
    s.spent += o.total;
    stats.set(o.user_id, s);
  });
  const mByUser = new Map((meas ?? []).map((m) => [m.user_id, m]));
  const q = (searchParams.q ?? '').toLowerCase();
  const rows = (profiles ?? [])
    .filter((p) => !q || `${p.full_name} ${p.email} ${p.phone}`.toLowerCase().includes(q))
    .map((p) => ({ ...p, ...(stats.get(p.user_id) ?? { count: 0, spent: 0 }), m: mByUser.get(p.user_id) }))
    .sort((a, b) => b.spent - a.spent);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="h1">Customers</h1>
      <form className="flex max-w-[480px] gap-2">
        <label htmlFor="cq" className="sr-only">
          Search customers
        </label>
        <input id="cq" name="q" defaultValue={searchParams.q} placeholder="Name, email or phone" className="field" />
        <button className="btn-secondary px-4">Search</button>
      </form>
      <ul className="border-t border-line">
        {rows.map((c) => (
          <li key={c.user_id} className="border-b border-line py-4">
            <details>
              <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 text-[15px] md:grid-cols-4 md:items-center">
                <span className="font-medium">
                  {c.full_name || '—'} {c.role === 'admin' && <span className="label-sm text-accent">Admin</span>}
                </span>
                <span className="text-right font-semibold md:order-last">{naira(c.spent)}</span>
                <span className="truncate text-sm text-muted">{c.email}</span>
                <span className="text-right text-sm text-muted md:text-left">
                  {c.count} {c.count === 1 ? 'order' : 'orders'}
                </span>
              </summary>
              <div className="mt-3 flex flex-col gap-2 bg-smoke p-4 text-sm">
                <span>
                  {c.phone ? displayPhone(c.phone) : 'No phone'} · joined {formatDate(c.created_at)}
                </span>
                {c.m ? (
                  <span>
                    {KEYS.filter((k) => c.m[k] != null)
                      .map((k) => `${k[0].toUpperCase() + k.slice(1)} ${c.m[k]}`)
                      .join(' · ') || 'No body measurements'}
                    {' cm'}
                    {c.m.shoe_size ? ` · Shoe ${c.m.shoe_system} ${c.m.shoe_size}` : ''}
                    {c.m.foot_length_cm ? ` · foot ${c.m.foot_length_cm} cm` : ''}
                  </span>
                ) : (
                  <span className="text-muted">No saved measurements.</span>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
