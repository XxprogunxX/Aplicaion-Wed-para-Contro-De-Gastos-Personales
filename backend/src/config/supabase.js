const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

const supabaseKeyMode = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? 'service-role'
  : 'publishable-or-anon';

const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

module.exports = {
  supabase,
  isSupabaseConfigured,
  supabaseKeyMode,
};
