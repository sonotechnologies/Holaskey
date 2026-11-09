import { notFound } from 'next/navigation';
import { getCategories, getProductByIdForAdmin } from '@/lib/catalog';
import { ProductEditor } from '../ProductEditor';

export const metadata = { title: 'Edit product' };

export default async function EditProduct({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([getProductByIdForAdmin(params.id), getCategories()]);
  if (!product) notFound();
  return <ProductEditor product={product} categories={categories} />;
}
