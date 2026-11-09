import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getViewer, safeNext } from '@/lib/auth';
import { AuthForms } from '../AuthForms.server';

export const metadata: Metadata = { title: 'Sign up', robots: { index: false } };

export default async function SignupPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = safeNext(searchParams.next);
  if (await getViewer()) redirect(next);
  return <AuthForms mode="signup" next={next} />;
}
