const { supabase, isSupabaseConfigured } = require('../config/supabase');

const CHAT_HISTORY_TABLE = String(process.env.SUPABASE_CHAT_HISTORY_TABLE || 'chat_messages').trim() || 'chat_messages';
const MAX_PERSISTED_MESSAGES = 50;
const MAX_PERSISTED_MESSAGE_LENGTH = 4000;
const fallbackChatHistoryByUser = new Map();

let lastLoggedWarningSignature = '';

function logChatHistoryWarning(mode, error) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const signature = `${mode}:${error?.code || ''}:${error?.message || ''}`;
  if (!signature || signature === lastLoggedWarningSignature) {
    return;
  }

  lastLoggedWarningSignature = signature;
  console.warn(`[chat-history] ${mode} fallback activado: ${error?.message || 'Error desconocido'}`);
}

function clampLimit(limit) {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return MAX_PERSISTED_MESSAGES;
  }

  return Math.min(Math.trunc(parsed), MAX_PERSISTED_MESSAGES);
}

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase() === 'assistant' ? 'assistant' : 'user';
}

function sanitizeMessage(message) {
  if (!message || typeof message !== 'object') {
    return null;
  }

  const content = String(message.content || '').trim().slice(0, MAX_PERSISTED_MESSAGE_LENGTH);
  if (!content) {
    return null;
  }

  const createdAtValue = String(message.createdAt || '').trim();
  const createdAt = createdAtValue && !Number.isNaN(new Date(createdAtValue).getTime())
    ? new Date(createdAtValue).toISOString()
    : new Date().toISOString();

  return {
    role: normalizeRole(message.role),
    content,
    createdAt,
  };
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .map((message) => sanitizeMessage(message))
    .filter(Boolean)
    .slice(-MAX_PERSISTED_MESSAGES);
}

function syncFallbackHistory(userId, messages) {
  const safeUserId = String(userId || '').trim();
  if (!safeUserId) {
    return;
  }

  fallbackChatHistoryByUser.set(safeUserId, sanitizeMessages(messages));
}

function appendFallbackHistory(userId, messages) {
  const safeUserId = String(userId || '').trim();
  if (!safeUserId) {
    return [];
  }

  const currentMessages = fallbackChatHistoryByUser.get(safeUserId) || [];
  const nextMessages = [...currentMessages, ...sanitizeMessages(messages)].slice(-MAX_PERSISTED_MESSAGES);
  fallbackChatHistoryByUser.set(safeUserId, nextMessages);
  return nextMessages;
}

function getFallbackHistory(userId, limit = MAX_PERSISTED_MESSAGES) {
  const safeUserId = String(userId || '').trim();
  if (!safeUserId) {
    return [];
  }

  const safeLimit = clampLimit(limit);
  const storedMessages = fallbackChatHistoryByUser.get(safeUserId) || [];
  return storedMessages.slice(-safeLimit).map((message) => ({ ...message }));
}

async function getChatHistoryForUser(userId, options = {}) {
  const safeUserId = String(userId || '').trim();
  if (!safeUserId) {
    return [];
  }

  const safeLimit = clampLimit(options.limit);

  if (!isSupabaseConfigured) {
    return getFallbackHistory(safeUserId, safeLimit);
  }

  try {
    const { data, error } = await supabase
      .from(CHAT_HISTORY_TABLE)
      .select('role,content,created_at')
      .eq('user_id', safeUserId)
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (error) {
      throw error;
    }

    const normalizedMessages = (data || [])
      .slice()
      .reverse()
      .map((message) => sanitizeMessage({
        role: message.role,
        content: message.content,
        createdAt: message.created_at,
      }))
      .filter(Boolean);

    syncFallbackHistory(safeUserId, normalizedMessages);
    return normalizedMessages;
  } catch (error) {
    logChatHistoryWarning('lectura', error);
    return getFallbackHistory(safeUserId, safeLimit);
  }
}

async function appendChatMessagesForUser(userId, messages) {
  const safeUserId = String(userId || '').trim();
  if (!safeUserId) {
    return [];
  }

  const safeMessages = sanitizeMessages(messages);
  if (safeMessages.length === 0) {
    return getFallbackHistory(safeUserId);
  }

  const fallbackHistory = appendFallbackHistory(safeUserId, safeMessages);

  if (!isSupabaseConfigured) {
    return fallbackHistory;
  }

  try {
    const payload = safeMessages.map((message) => ({
      user_id: safeUserId,
      role: message.role,
      content: message.content,
      created_at: message.createdAt,
    }));

    const { error } = await supabase
      .from(CHAT_HISTORY_TABLE)
      .insert(payload);

    if (error) {
      throw error;
    }

    return fallbackHistory;
  } catch (error) {
    logChatHistoryWarning('escritura', error);
    return fallbackHistory;
  }
}

async function clearChatHistoryForUser(userId) {
  const safeUserId = String(userId || '').trim();
  if (!safeUserId) {
    return;
  }

  fallbackChatHistoryByUser.delete(safeUserId);

  if (!isSupabaseConfigured) {
    return;
  }

  try {
    const { error } = await supabase
      .from(CHAT_HISTORY_TABLE)
      .delete()
      .eq('user_id', safeUserId);

    if (error) {
      throw error;
    }
  } catch (error) {
    logChatHistoryWarning('borrado', error);
  }
}

function __resetChatHistoryForTests() {
  fallbackChatHistoryByUser.clear();
  lastLoggedWarningSignature = '';
}

module.exports = {
  appendChatMessagesForUser,
  getChatHistoryForUser,
  clearChatHistoryForUser,
  __resetChatHistoryForTests,
};