'use client';
import { useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { deleteCategory, saveCategory } from '@/app/actions/admin';
import { FormError, FormNote } from '@/components/Field';
import { Submit } from '@/components/Submit';
import type { Category } from '@/lib/types';

export function CategoryRow({ c }: { c?: Category }) {
  const [state, action] = useFormState(saveCategory, null);
  const [pending, start] = useTransition();
  const [delErr, setDelErr] = useState('');
  return (
    <form action={action} className={`grid grid-cols-2 items-end gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_80px_1.4fr_auto] ${c ? 'bg-smoke' : 'border border-dashed border-muted'}`}>
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="col-span-2 flex flex-col md:col-span-1">
        <label className="field-label" htmlFor={`n-${c?.id ?? 'new'}`}>
          {c ? 'Name' : 'New category'}
        </label>
        <input id={`n-${c?.id ?? 'new'}`} name="name" defaultValue={c?.name} required className="field" />
      </div>
      <div className="flex flex-col">
        <label className="field-label" htmlFor={`t-${c?.id ?? 'new'}`}>
          Type
        </label>
        <select id={`t-${c?.id ?? 'new'}`} name="type" defaultValue={c?.type ?? 'clothing'} className="field">
          <option value="clothing">Clothing</option>
          <option value="shoes">Shoes</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="field-label" htmlFor={`s-${c?.id ?? 'new'}`}>
          Slug
        </label>
        <input id={`s-${c?.id ?? 'new'}`} name="slug" defaultValue={c?.slug} placeholder="auto" className="field" />
      </div>
      <div className="flex flex-col">
        <label className="field-label" htmlFor={`o-${c?.id ?? 'new'}`}>
          Order
        </label>
        <input id={`o-${c?.id ?? 'new'}`} name="sort" inputMode="numeric" defaultValue={c?.sort ?? 0} className="field" />
      </div>
      <div className="flex flex-col">
        <label className="field-label" htmlFor={`i-${c?.id ?? 'new'}`}>
          Tile image path
        </label>
        <input id={`i-${c?.id ?? 'new'}`} name="image_path" defaultValue={c?.image_path ?? ''} placeholder="/img/… or bucket path" className="field" />
      </div>
      <div className="col-span-2 flex items-center gap-4 md:col-span-1">
        <Submit pendingText="…" className="px-5">
          {c ? 'Save' : 'Add'}
        </Submit>
        {c && (
          <button
            type="button"
            disabled={pending}
            className="link"
            onClick={() =>
              confirm(`Delete ${c.name}?`) &&
              start(async () => {
                const r = await deleteCategory(c.id);
                setDelErr(r.ok ? '' : r.error);
              })
            }
          >
            Delete
          </button>
        )}
      </div>
      {(state || delErr) && (
        <div className="col-span-full">
          {delErr ? <FormError>{delErr}</FormError> : state && (state.ok ? <FormNote>{state.message}</FormNote> : <FormError>{state.error}</FormError>)}
        </div>
      )}
    </form>
  );
}
