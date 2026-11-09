'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { saveProduct } from '@/app/actions/admin';
import { FormError, FormNote } from '@/components/Field';
import { CloseIcon } from '@/components/icons';
import { productImageUrl } from '@/lib/images';
import type { Category, Product } from '@/lib/types';
import { fileExt, uploadWithProgress } from '@/lib/upload';

type Img = { key: string; path: string | null; alt: string; preview: string; pct: number; error?: string };
type Var = { key: string; id?: string; size: string; colour: string; colour_hex: string; stock: string; sku: string };

const CLOTH = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE = ['40', '41', '42', '43', '44', '45', '46'];

export function ProductEditor({ product, categories }: { product: Product | null; categories: Category[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({
    title: product?.title ?? '',
    slug: product?.slug ?? '',
    category_id: product?.category?.id ?? categories[0]?.id ?? '',
    price: product ? String(product.price / 100) : '',
    compare_at_price: product?.compare_at_price ? String(product.compare_at_price / 100) : '',
    description: product?.description ?? '',
    care: product?.care ?? '',
  });
  const [flags, setFlags] = useState({ is_new: product?.is_new ?? true, is_featured: product?.is_featured ?? false, archived: product?.status === 'archived' });
  const [images, setImages] = useState<Img[]>(
    (product?.images ?? []).map((i) => ({ key: i.path, path: i.path, alt: i.alt, preview: productImageUrl(i.path)!, pct: 100 })),
  );
  const [variants, setVariants] = useState<Var[]>(
    (product?.variants ?? []).map((v) => ({ key: v.id, id: v.id, size: v.size, colour: v.colour, colour_hex: v.colour_hex ?? '', stock: String(v.stock), sku: v.sku ?? '' })),
  );
  const [newColour, setNewColour] = useState({ name: '', hex: '#0B0907' });
  const fileInput = useRef<HTMLInputElement>(null);
  const dragFrom = useRef<number | null>(null);
  const cat = categories.find((c) => c.id === f.category_id);

  const addFiles = (files: FileList) => {
    Array.from(files)
      .slice(0, 8 - images.length)
      .forEach((file) => {
        if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) return setMsg({ ok: false, text: `${file.name}: use JPG, PNG, WebP or AVIF.` });
        if (file.size > 10 * 1048576) return setMsg({ ok: false, text: `${file.name} is over 10 MB.` });
        const key = crypto.randomUUID();
        const path = `${(f.slug || f.title || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${key}.${fileExt(file)}`;
        setImages((im) => [...im, { key, path: null, alt: '', preview: URL.createObjectURL(file), pct: 0 }]);
        uploadWithProgress('products', path, file, (pct) => setImages((im) => im.map((x) => (x.key === key ? { ...x, pct } : x))))
          .then(() => setImages((im) => im.map((x) => (x.key === key ? { ...x, path } : x))))
          .catch((e: Error) => setImages((im) => im.map((x) => (x.key === key ? { ...x, error: e.message } : x))));
      });
  };
  const move = (from: number, to: number) =>
    setImages((im) => {
      if (to < 0 || to >= im.length) return im;
      const copy = [...im];
      const [x] = copy.splice(from, 1);
      copy.splice(to, 0, x);
      return copy;
    });

  const addColourRow = () => {
    if (!newColour.name.trim()) return;
    const sizes = cat?.type === 'shoes' ? SHOE : CLOTH;
    setVariants((v) => [
      ...v,
      ...sizes
        .filter((s) => !v.some((x) => x.size === s && x.colour.toLowerCase() === newColour.name.trim().toLowerCase()))
        .map((size) => ({ key: crypto.randomUUID(), size, colour: newColour.name.trim(), colour_hex: newColour.hex, stock: '0', sku: '' })),
    ]);
    setNewColour({ name: '', hex: '#0B0907' });
  };

  const save = () =>
    start(async () => {
      setMsg(null);
      if (images.some((i) => !i.path && !i.error)) return setMsg({ ok: false, text: 'Wait for images to finish uploading.' });
      const r = await saveProduct(
        product?.id ?? null,
        f,
        flags,
        images.filter((i) => i.path).map((i) => ({ path: i.path!, alt: i.alt })),
        variants.map((v) => ({ id: v.id, size: v.size, colour: v.colour, colour_hex: v.colour_hex || null, stock: Number(v.stock) || 0, sku: v.sku || null })),
      );
      if (!r.ok) return setMsg({ ok: false, text: r.error });
      setMsg({ ok: true, text: 'Saved.' });
      if (!product && r.id) router.replace(`/admin/products/${r.id}`);
      else router.refresh();
    });

  const input = (k: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="flex flex-col">
      <label htmlFor={`p-${k}`} className="field-label">
        {label}
      </label>
      <input id={`p-${k}`} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="field" {...props} />
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/admin/products" className="label text-muted">
          ← Products
        </Link>
        <h1 className="h1">{product ? product.title : 'New product'}</h1>
        {product && (
          <Link href={`/product/${product.slug}`} className="link self-start" target="_blank">
            View in shop
          </Link>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        {input('title', 'Title', { required: true })}
        {input('slug', 'Slug', { placeholder: 'auto from title' })}
        <div className="flex flex-col">
          <label htmlFor="p-cat" className="field-label">
            Category
          </label>
          <select id="p-cat" value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })} className="field">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.type === 'shoes' ? 'Shoes' : 'Clothing'} · {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {input('price', 'Price (₦)', { inputMode: 'numeric' })}
          {input('compare_at_price', 'Compare at (₦)', { inputMode: 'numeric', placeholder: 'optional' })}
        </div>
        <div className="flex flex-col sm:col-span-2">
          <label htmlFor="p-desc" className="field-label">
            Description
          </label>
          <textarea id="p-desc" rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="field resize-y" />
        </div>
        <div className="flex flex-col sm:col-span-2">
          <label htmlFor="p-care" className="field-label">
            Fabric &amp; care
          </label>
          <textarea id="p-care" rows={2} value={f.care} onChange={(e) => setF({ ...f, care: e.target.value })} className="field resize-y" />
        </div>
        <div className="flex flex-wrap gap-6 sm:col-span-2">
          {(
            [
              ['is_new', 'New in'],
              ['is_featured', 'Featured'],
              ['archived', 'Archived (hidden from shop)'],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex min-h-11 items-center gap-3 text-[15px]">
              <input type="checkbox" checked={flags[k]} onChange={(e) => setFlags({ ...flags, [k]: e.target.checked })} className="h-5 w-5 accent-[rgb(var(--hk-accent))]" />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="h2">Images</h2>
          <span className="text-sm text-muted">Up to 8, 4:5 portrait. Drag or use the arrows to reorder. Alt text is required.</span>
        </div>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((im, i) => (
            <li
              key={im.key}
              draggable
              onDragStart={() => (dragFrom.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragFrom.current !== null) move(dragFrom.current, i);
                dragFrom.current = null;
              }}
              className="flex flex-col gap-2"
            >
              <div className="relative aspect-[4/5] cursor-grab overflow-hidden bg-smoke">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.preview} alt={im.alt || `Image ${i + 1}`} className="h-full w-full object-cover" />
                <span className="label-sm absolute left-2 top-2 bg-bg/80 px-1.5 py-0.5">{i + 1}</span>
                <button type="button" aria-label={`Remove image ${i + 1}`} onClick={() => setImages((x) => x.filter((y) => y.key !== im.key))} className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center bg-bg/80">
                  <CloseIcon size={16} />
                </button>
                {!im.path && !im.error && <div className="absolute bottom-0 left-0 h-[3px] bg-accent" style={{ width: `${im.pct}%` }} />}
              </div>
              {im.error && <p className="text-xs text-err">{im.error}</p>}
              <div className="flex gap-1">
                <button type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => move(i, i - 1)} className="h-9 w-9 border border-line disabled:opacity-30">
                  ←
                </button>
                <button type="button" aria-label="Move later" disabled={i === images.length - 1} onClick={() => move(i, i + 1)} className="h-9 w-9 border border-line disabled:opacity-30">
                  →
                </button>
              </div>
              <label htmlFor={`alt-${im.key}`} className="sr-only">
                Alt text for image {i + 1}
              </label>
              <input
                id={`alt-${im.key}`}
                value={im.alt}
                onChange={(e) => setImages((x) => x.map((y) => (y.key === im.key ? { ...y, alt: e.target.value } : y)))}
                placeholder="Alt text, e.g. front, on model"
                className={`h-10 border bg-smoke px-2.5 text-sm outline-none focus:border-ink ${im.alt.trim() ? 'border-line' : 'border-accent'}`}
              />
            </li>
          ))}
          {images.length < 8 && (
            <li>
              <button type="button" onClick={() => fileInput.current?.click()} className="label flex aspect-[4/5] w-full items-center justify-center border border-dashed border-muted hover:border-ink">
                + Add images
              </button>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" tabIndex={-1} onChange={(e) => e.target.files && addFiles(e.target.files)} />
            </li>
          )}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="h2">Variants &amp; stock</h2>
        <div className="flex flex-wrap items-end gap-3 bg-smoke p-4">
          <div className="flex flex-col">
            <label htmlFor="nc-name" className="field-label">
              Add a colour
            </label>
            <input id="nc-name" value={newColour.name} onChange={(e) => setNewColour({ ...newColour, name: e.target.value })} placeholder="Onyx" className="field w-40" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="nc-hex" className="field-label">
              Swatch
            </label>
            <input id="nc-hex" type="color" value={newColour.hex} onChange={(e) => setNewColour({ ...newColour, hex: e.target.value })} className="h-12 w-16 border border-line bg-smoke" />
          </div>
          <button type="button" onClick={addColourRow} className="btn-secondary px-4">
            Add with {cat?.type === 'shoes' ? 'shoe' : 'clothing'} sizes
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[15px]">
            <thead>
              <tr className="label text-left text-muted">
                <th className="py-2 pr-2 font-medium">Size</th>
                <th className="py-2 pr-2 font-medium">Colour</th>
                <th className="py-2 pr-2 font-medium">Stock</th>
                <th className="py-2 pr-2 font-medium">SKU</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {variants.map((v, i) => (
                <tr key={v.key} className="border-t border-line">
                  {(['size', 'colour', 'stock', 'sku'] as const).map((k) => (
                    <td key={k} className="py-1.5 pr-2">
                      <label htmlFor={`v-${v.key}-${k}`} className="sr-only">
                        {k} for row {i + 1}
                      </label>
                      <input
                        id={`v-${v.key}-${k}`}
                        value={v[k]}
                        inputMode={k === 'stock' ? 'numeric' : undefined}
                        onChange={(e) => setVariants((x) => x.map((y) => (y.key === v.key ? { ...y, [k]: e.target.value } : y)))}
                        className={`h-10 w-full min-w-0 border bg-smoke px-2 outline-none focus:border-ink ${k === 'stock' && Number(v.stock) === 0 ? 'border-accent' : 'border-line'}`}
                      />
                    </td>
                  ))}
                  <td className="py-1.5">
                    <button type="button" aria-label={`Remove variant ${v.size} ${v.colour}`} onClick={() => setVariants((x) => x.filter((y) => y.key !== v.key))} className="flex h-10 w-10 items-center justify-center">
                      <CloseIcon size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={() => setVariants((x) => [...x, { key: crypto.randomUUID(), size: '', colour: x.at(-1)?.colour ?? '', colour_hex: x.at(-1)?.colour_hex ?? '', stock: '0', sku: '' }])} className="link self-start">
          + Add one row
        </button>
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-4 border-t border-line bg-bg px-4 py-3 md:mx-0 md:px-0">
        <button type="button" disabled={pending} onClick={save} className="btn-primary">
          {pending ? 'Saving…' : 'Save product'}
        </button>
        {msg && (msg.ok ? <FormNote>{msg.text}</FormNote> : <FormError>{msg.text}</FormError>)}
      </div>
    </div>
  );
}
