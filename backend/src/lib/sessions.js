/**
 * Persistencia de sesiones (tabla public.sessions en Supabase).
 * Esquema esperado:
 * id uuid PK, user_id uuid, device_info text, ip_address text,
 * created_at timestamptz, expires_at timestamptz, last_active timestamptz,
 * is_active boolean
 *
 * Sin Supabase, usa almacenamiento en memoria solo para desarrollo local.
 */
const { randomUUID } = require('crypto');
const { supabase, isSupabaseConfigured } = require('../config/supabase');

/** @type {Map<string, object>} */
const memorySessions = new Map();

function nowIso() {
  return new Date().toISOString();
}

/**
 * @param {object} input
 * @param {string} input.userId
 * @param {string} input.deviceInfo
 * @param {string} input.ipAddress
 * @param {Date} input.expiresAt
 */
async function createSessionRecord(input) {
  const row = {
    user_id: String(input.userId),
    device_info: String(input.deviceInfo || '').slice(0, 2048),
    ip_address: String(input.ipAddress || '').slice(0, 128),
    created_at: nowIso(),
    expires_at: input.expiresAt.toISOString(),
    last_active: nowIso(),
    is_active: true,
  };

  if (!isSupabaseConfigured || !supabase) {
    const id = randomUUID();
    memorySessions.set(id, { id, ...row });
    return { id, error: null };
  }

  const { data, error } = await supabase.from('sessions').insert(row).select('id').single();

  if (error) {
    return { id: null, error };
  }

  return { id: data?.id || null, error: null };
}

/**
 * @param {string} sessionId
 * @param {string} userId
 * @returns {Promise<{ ok: boolean, row?: object }>}
 */
async function assertActiveSession(sessionId, userId) {
  if (!sessionId || !userId) {
    return { ok: false };
  }

  if (!isSupabaseConfigured || !supabase) {
    const row = memorySessions.get(String(sessionId));
    if (!row || String(row.user_id) !== String(userId)) {
      return { ok: false };
    }
    if (!row.is_active) {
      return { ok: false };
    }
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      return { ok: false };
    }
    return { ok: true, row };
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('id,user_id,expires_at,is_active,last_active')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false };
  }
  if (!data.is_active) {
    return { ok: false };
  }
  if (new Date(data.expires_at).getTime() <= Date.now()) {
    return { ok: false };
  }

  return { ok: true, row: data };
}

async function touchLastActive(sessionId, userId) {
  if (!isSupabaseConfigured || !supabase) {
    const row = memorySessions.get(String(sessionId));
    if (row && String(row.user_id) === String(userId)) {
      row.last_active = nowIso();
      memorySessions.set(String(sessionId), row);
    }
    return;
  }

  await supabase
    .from('sessions')
    .update({ last_active: nowIso() })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .eq('is_active', true);
}

/**
 * @param {string} sessionId
 * @param {string} userId
 */
async function deactivateSession(sessionId, userId) {
  if (!sessionId) {
    return { error: null };
  }

  if (!isSupabaseConfigured || !supabase) {
    const row = memorySessions.get(String(sessionId));
    if (row && String(row.user_id) === String(userId)) {
      row.is_active = false;
      memorySessions.set(String(sessionId), row);
    }
    return { error: null };
  }

  const { error } = await supabase
    .from('sessions')
    .update({ is_active: false, last_active: nowIso() })
    .eq('id', sessionId)
    .eq('user_id', userId);

  return { error };
}

module.exports = {
  createSessionRecord,
  assertActiveSession,
  touchLastActive,
  deactivateSession,
};
