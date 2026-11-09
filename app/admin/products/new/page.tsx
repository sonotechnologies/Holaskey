import { getCategories } from '@/lib/catalog';
import { ProductEditor } from '../ProductEditor';

export const metadata = { title: 'New product' };

export default async function NewProduct() {
  return <ProductEditor product={null} categories={await getCategories()} />;
}
