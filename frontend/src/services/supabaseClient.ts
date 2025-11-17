import { createClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://tnryhnnstqyqiwvwlncu.supabase.co';
const supabaseUrl = (process.env.REACT_APP_SUPABASE_URL || defaultSupabaseUrl).trim();
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error(
    'REACT_APP_SUPABASE_ANON_KEY is not set. Add it to your environment before using Supabase features.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
});

export const getSupabaseConfig = () => ({
  supabaseUrl,
});
