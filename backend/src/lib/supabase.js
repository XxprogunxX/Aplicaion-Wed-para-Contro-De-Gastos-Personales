/**
 * Acceso a Supabase para autenticación y datos de servidor.
 * Reutiliza el cliente central; añade helpers explícitos para capa de auth.
 */
const { supabase, isSupabaseConfigured } = require('../config/supabase');

/**
 * Valida credenciales contra Auth de Supabase.
 * @returns {Promise<{ user: object | null, error: Error | null }>}
 */
async function signInWithPassword(email, password) {
  if (!isSupabaseConfigured || !supabase) {
    return { user: null, error: new Error('Supabase no configurado') };
  }

  const result = await supabase.auth.signInWithPassword({
    email: String(email || '').trim().toLowerCase(),
    password: String(password || ''),
  });

  if (result.error) {
    return { user: null, error: result.error };
  }

  const user = result.data?.user || null;
  return { user, error: null, session: result.data?.session || null };
}

function getSupabaseAdmin() {
  return { supabase, isSupabaseConfigured };
}

module.exports = {
  supabase,
  isSupabaseConfigured,
  signInWithPassword,
  getSupabaseAdmin,
};
