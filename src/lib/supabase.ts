import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isValidUrl = (url: string) => {
  try {
    return url.startsWith('http');
  } catch {
    return false;
  }
};

// Only initialize if we have a real URL, otherwise export a null-safe proxy or handle in usage
export const supabase = isValidUrl(SUPABASE_URL) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : (null as any);

if (!supabase) {
  console.warn('⚠️ Supabase URL is missing or invalid. Please update NEXT_PUBLIC_SUPABASE_URL in .env.local');
}
