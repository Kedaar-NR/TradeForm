import { createClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://tnryhnnstqyqiwvwlncu.supabase.co';
const supabaseUrl = (process.env.REACT_APP_SUPABASE_URL || defaultSupabaseUrl).trim();
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Only create client if key is provided, otherwise create a placeholder
// This allows the build to succeed even without the key set
let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
      },
    });
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
  }
} else {
  if (typeof window !== 'undefined') {
    console.warn(
      'REACT_APP_SUPABASE_ANON_KEY is not set. Supabase features will not be available. ' +
      'Add it to your environment variables to enable Supabase features.'
    );
  }
}

// Export a getter function that throws if Supabase is not initialized
export const getSupabase = () => {
  if (!supabase) {
    throw new Error(
      'Supabase is not initialized. REACT_APP_SUPABASE_ANON_KEY must be set in your environment variables.'
    );
  }
  return supabase;
};

// Export supabase directly (may be null if key is not set)
export { supabase };

export const getSupabaseConfig = () => ({
  supabaseUrl,
  isConfigured: !!supabaseAnonKey,
});
