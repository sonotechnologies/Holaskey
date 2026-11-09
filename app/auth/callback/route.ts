import { NextResponse, type NextRequest } from 'next/server';
import { safeNext } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

/** OAuth, email verification and password-reset links land here with a one-time code. */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));
  if (code) {
    const { error } = await createClient().auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
