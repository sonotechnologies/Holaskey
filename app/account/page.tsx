import type { Metadata } from 'next';
import { signOut } from '@/app/actions/auth';
import { requireViewer } from '@/lib/auth';
import { displayPhone } from '@/lib/format';
import { ProfileForm } from './forms';

export const metadata: Metadata = { title: 'Profile', robots: { index: false } };

export default async function ProfilePage() {
  const v = await requireViewer('/account');
  return (
    <div className="flex max-w-[480px] flex-col gap-6">
      <ProfileForm name={v.fullName} phone={v.phone ? displayPhone(v.phone) : ''} email={v.email} verified={v.emailVerified} />
      <form action={signOut}>
        <button className="link">Sign out</button>
      </form>
    </div>
  );
}
