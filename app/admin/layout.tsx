import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { AdminNav } from './AdminNav';

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Admin · HOLASKEY' }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <main className="wrap pb-16 pt-4 lg:pb-24 lg:pt-8">
      <AdminNav />
      {children}
    </main>
  );
}
