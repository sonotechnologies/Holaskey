import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getViewer, safeNext } from '@/lib/auth';
import { AuthForms } from '../AuthForms.server';

export const metadata: Metadata = { title: 'Log in', robots: { index: false } };

const ERRORS: Record<string, string> = {
  link: 'That link has expired or was already used. Log in, or ask for a new one.',
  google: 'Google sign-in did not complete. Try again.',
  'not-configured': 'Accounts are not connected yet.',
};

export default async function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  const next = safeNext(searchParams.next);
  if (await getViewer()) redirect(next);
  return <AuthForms mode="login" next={next} notice={searchParams.error ? ERRORS[searchParams.error] : undefined} />;
}
