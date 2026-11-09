import type { Metadata } from 'next';
import { AuthForms } from '../AuthForms.server';

export const metadata: Metadata = { title: 'Reset password', robots: { index: false } };

export default function ResetPage() {
  return <AuthForms mode="reset" next="/account" />;
}
