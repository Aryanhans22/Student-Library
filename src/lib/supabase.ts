import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  Boolean(rawUrl.trim()) && 
  Boolean(rawKey.trim()) &&
  !rawUrl.includes('placeholder') &&
  !rawUrl.includes('your-supabase') &&
  !rawUrl.includes('your-project') &&
  !rawUrl.includes('example.co') &&
  !rawKey.includes('placeholder') &&
  !rawKey.includes('your-anon-key');

if (!isSupabaseConfigured) {
  console.info(
    'ℹ️ Running in Local Storage Mode (Supabase is not configured or using placeholders).'
  );
}

export const supabase = createClient(
  isSupabaseConfigured ? rawUrl : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
);
