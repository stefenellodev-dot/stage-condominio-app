import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// NOTA: autoRefreshToken deshabilitado porque con el GoTrue de piave (JWT exp 3600s)
// getSession() se colgaba indefinidamente al intentar refrescar el token.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

if (typeof window !== 'undefined') window.__supabase = supabase;
