import type { Metadata } from 'next';
import { requireViewer } from '@/lib/auth';
import { AuthShell } from '../../AuthShell';
import { NewPasswordForm } from '../../AuthForms';

export const metadata: Metadata = { title: 'New password', robots: { index: false } };

export default async function NewPasswordPage() {
  await requireViewer('/reset-password');
  return (
    <AuthShell mode="reset">
      <NewPasswordForm />
    </AuthShell>
  );
}
