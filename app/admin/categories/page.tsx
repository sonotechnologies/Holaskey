import { createClient } from '@/lib/supabase/server';
import type { Category } from '@/lib/types';
import { CategoryRow } from './CategoryRow';

export const metadata = { title: 'Categories' };

export default async function CategoriesPage() {
  const { data } = await createClient().from('categories').select('*').order('type').order('sort');
  const cats = (data as Category[]) ?? [];
  return (
    <div className="flex flex-col gap-6">
      <h1 className="h1">Categories</h1>
      <p className="text-muted">Clothing and shoe sub-categories. These are the tiles on the home page and the shop filters.</p>
      <div className="flex flex-col gap-3">
        {cats.map((c) => (
          <CategoryRow key={c.id} c={c} />
        ))}
        <CategoryRow />
      </div>
    </div>
  );
}
