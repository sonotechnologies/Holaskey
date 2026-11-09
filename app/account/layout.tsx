import { requireViewer } from '@/lib/auth';
import { AccountTabs } from './AccountTabs';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer('/account');
  return (
    <main className="wrap pb-16 pt-6 lg:pb-24 lg:pt-12 animate-rise">
      <div className="mb-6 flex flex-col gap-2">
        <p className="label text-muted">Signed in as {viewer.fullName || viewer.email}</p>
        <h1 className="h1">Account</h1>
      </div>
      <AccountTabs />
      {children}
    </main>
  );
}
