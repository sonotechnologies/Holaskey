import { AuthShell } from './AuthShell';
import { LoginForm, ResetForm, SignupForm } from './AuthForms';

export function AuthForms({ mode, next, notice }: { mode: 'login' | 'signup' | 'reset'; next: string; notice?: string }) {
  return (
    <AuthShell mode={mode} next={next}>
      {mode === 'login' ? <LoginForm next={next} notice={notice} /> : mode === 'signup' ? <SignupForm next={next} /> : <ResetForm />}
    </AuthShell>
  );
}
