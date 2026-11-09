import Link from 'next/link';
import { Img, PhotoPlaceholder } from '@/components/Img';
import { getProductsForAdmin, totalStock } from '@/lib/catalog';
import { naira } from '@/lib/format';
import { productImageUrl } from '@/lib/images';

export const metadata = { title: 'Products' };

export default async function AdminProducts({ searchParams }: { searchParams: { show?: string } }) {
  const all = await getProductsForAdmin();
  const archived = searchParams.show === 'archived';
  const list = all.filter((p) => (archived ? p.status === 'archived' : p.status === 'active'));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="h1">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">
          New product
        </Link>
      </div>
      <div className="flex gap-2">
        <Link href="/admin/products" className={`chip hover:no-underline ${!archived ? 'chip-on hover:text-bg' : 'hover:text-ink'}`}>
          Active ({all.filter((p) => p.status === 'active').length})
        </Link>
        <Link href="/admin/products?show=archived" className={`chip hover:no-underline ${archived ? 'chip-on hover:text-bg' : 'hover:text-ink'}`}>
          Archived ({all.filter((p) => p.status === 'archived').length})
        </Link>
      </div>
      <ul className="border-t border-line">
        {list.map((p) => {
          const img = productImageUrl(p.images[0]?.path);
          const stock = totalStock(p);
          return (
            <li key={p.id}>
              <Link href={`/admin/products/${p.id}`} className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 border-b border-line py-3 text-[15px] text-ink hover:text-ink hover:no-underline">
                <span className="relative aspect-[4/5] bg-smoke">{img ? <Img src={img} alt="" fill sizes="56px" className="object-cover" /> : <PhotoPlaceholder label="—" />}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{p.title}</span>
                  <span className="text-sm text-muted">
                    {p.category?.name ?? 'No category'}
                    {p.is_new ? ' · New in' : ''}
                    {p.is_featured ? ' · Featured' : ''}
                  </span>
                </span>
                <span className="flex flex-col items-end">
                  <span className="font-semibold">{naira(p.price)}</span>
                  <span className={`label-sm ${stock === 0 ? 'text-err' : stock <= 3 ? 'text-accent' : 'text-muted'}`}>{stock === 0 ? 'Sold out' : `${stock} in stock`}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
