import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from './SettingsForm';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const { data } = await createClient().from('settings').select('*').eq('singleton', true).single();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="h1">Settings</h1>
      <SettingsForm s={data} />
    </div>
  );
}
