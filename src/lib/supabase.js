import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// NOTA: autoRefreshToken deshabilitado porque con el GoTrue de piave (JWT exp 3600s)
// getSession() se colgaba indefinidamente al intentar refrescar el token,
// dejando loading=true y la app en "Cargando...".
// Consecuencia: el usuario debe re-autenticarse cada ~1 hora.
// Revisar cuando se actualice @supabase/supabase-js o se ajuste GoTrue.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
