const { randomUUID } = require('crypto');
const { supabase, isSupabaseConfigured } = require('../config/supabase');

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant';
const FALLBACK_MODEL = 'fallback-local';
const ACTION_MODEL = 'assistant-action-engine';
const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL_PREFIX = 'groq:';
const DEFAULT_TIMEOUT_MS = 15000;
const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_MESSAGE_LENGTH = 500;
const QUOTA_ERROR_SNIPPETS = ['quota exceeded', 'rate limit', 'billing', 'free_tier'];
const PENDING_ACTION_TTL_MS = 5 * 60 * 1000;
const MAX_CONTEXT_EXPENSES = 30;
const MAX_CONTEXT_BUDGETS = 12;
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

const BASE_FALLBACK_EXPENSES = [
  {
    id: 1,
    userId: DEMO_USER_ID,
    descripcion: 'Comida',
    monto: 50,
    categoria: 'Alimentacion',
    fecha: new Date().toISOString(),
  },
  {
    id: 2,
    userId: DEMO_USER_ID,
    descripcion: 'Transporte publico',
    monto: 20,
    categoria: 'Transporte',
    fecha: new Date().toISOString(),
  },
];

const BASE_FALLBACK_BUDGETS = [
  {
    id: 1,
    userId: DEMO_USER_ID,
    categoria: 'Alimentacion',
    monto: 500,
    periodo: 'mensual',
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
  },
];

const fallbackChatExpenses = BASE_FALLBACK_EXPENSES.map((item) => ({ ...item }));
const fallbackBudgets = BASE_FALLBACK_BUDGETS.map((item) => ({ ...item }));
const pendingExpenseActions = new Map();

const KNOWN_CATEGORIES = [
  'Alimentacion',
  'Transporte',
  'Servicios',
  'Salud',
  'Vivienda',
  'Entretenimiento',
  'Educacion',
  'Ahorro',
  'Deudas',
  'Suscripciones',
  'Otros',
];

function sanitizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((item) => item && typeof item.content === 'string')
    .slice(-MAX_HISTORY_MESSAGES)
    .map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content.trim().slice(0, MAX_HISTORY_MESSAGE_LENGTH) }],
    }))
    .filter((item) => item.parts[0].text.length > 0);
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeCategoryName(value) {
  const cleaned = String(value || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) {
    return '';
  }

  return cleaned
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function toAmount(value) {
  const normalized = String(value || '').replace(',', '.').trim();
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Number(parsed.toFixed(2));
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `$${amount.toFixed(2)}`;
}

function resolveDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sumAmounts(items) {
  return (items || []).reduce((total, item) => {
    const amount = Number(item?.monto);
    return Number.isFinite(amount) ? total + amount : total;
  }, 0);
}

function aggregateByCategory(items) {
  return (items || []).reduce((acc, item) => {
    const category = normalizeCategoryName(item?.categoria || 'Otros') || 'Otros';
    const amount = Number(item?.monto);
    if (!Number.isFinite(amount)) {
      return acc;
    }

    acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {});
}

function buildPrompt(message, user, financialContext) {
  const username = user?.username ? String(user.username) : 'Usuario';

  return [
    'Eres un asistente de control de gastos personales.',
    'Responde SIEMPRE en espanol claro y breve.',
    'Da recomendaciones accionables usando bullets cortos cuando aporte valor.',
    'No inventes datos del usuario. Si falta informacion, pide una aclaracion puntual.',
    `Usuario autenticado: ${username}.`,
    '',
    'Contexto financiero real del usuario:',
    financialContext,
    '',
    `Consulta del usuario: ${message}`,
  ].join('\n');
}

function parseGeminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return '';
  }

  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();
}

function isGeminiQuotaExceeded(status, message) {
  if (status !== 429) {
    return false;
  }

  const normalizedMessage = String(message || '').toLowerCase();
  return QUOTA_ERROR_SNIPPETS.some((snippet) => normalizedMessage.includes(snippet));
}

function shouldTrySecondaryProvider(error) {
  const status = Number(error?.status);

  if (error?.code === 'GEMINI_QUOTA_EXCEEDED' || error?.code === 'GROQ_QUOTA_EXCEEDED') {
    return true;
  }

  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function buildQuotaFallbackReply(user) {
  const username = user?.username ? String(user.username) : 'Usuario';

  return [
    `${username}, ahora mismo el asistente IA no esta disponible por limite de cuota.`,
    'Mientras se restablece, aplica estas acciones rapidas:',
    '- Define un tope diario para gastos variables y registralo al momento.',
    '- Revisa tus gastos de los ultimos 7 dias y recorta uno hoy.',
    '- Prioriza categorias esenciales antes de compras no planificadas.',
  ].join('\n');
}

function cleanupExpiredPendingActions(nowMs = Date.now()) {
  for (const [actionId, action] of pendingExpenseActions.entries()) {
    if (action.expiresAt <= nowMs) {
      pendingExpenseActions.delete(actionId);
    }
  }
}

function buildPendingActionDto(action) {
  if (!action) {
    return null;
  }

  return {
    id: action.id,
    type: 'create-expense',
    descripcion: action.draft.descripcion,
    monto: action.draft.monto,
    categoria: action.draft.categoria,
    expiresAt: new Date(action.expiresAt).toISOString(),
  };
}

function clearPendingActionsForUser(userId) {
  const safeUserId = String(userId || '').trim();
  if (!safeUserId) {
    return;
  }

  for (const [actionId, action] of pendingExpenseActions.entries()) {
    if (String(action.userId) === safeUserId) {
      pendingExpenseActions.delete(actionId);
    }
  }
}

function createPendingExpenseAction({ userId, draft }) {
  cleanupExpiredPendingActions();
  clearPendingActionsForUser(userId);

  const createdAt = Date.now();
  const action = {
    id: randomUUID(),
    userId: String(userId),
    draft,
    createdAt,
    expiresAt: createdAt + PENDING_ACTION_TTL_MS,
  };

  pendingExpenseActions.set(action.id, action);
  return action;
}

function getPendingExpenseAction(actionId, userId) {
  cleanupExpiredPendingActions();
  const safeActionId = String(actionId || '').trim();
  if (!safeActionId) {
    return null;
  }

  const action = pendingExpenseActions.get(safeActionId);
  if (!action) {
    return null;
  }

  if (action.userId !== String(userId)) {
    return null;
  }

  if (action.expiresAt <= Date.now()) {
    pendingExpenseActions.delete(safeActionId);
    return null;
  }

  return action;
}

function getLatestPendingExpenseAction(userId) {
  cleanupExpiredPendingActions();
  const safeUserId = String(userId || '').trim();
  if (!safeUserId) {
    return null;
  }

  let latest = null;

  for (const action of pendingExpenseActions.values()) {
    if (String(action.userId) !== safeUserId) {
      continue;
    }

    if (!latest || action.createdAt > latest.createdAt) {
      latest = action;
    }
  }

  return latest;
}

function deletePendingExpenseAction(actionId) {
  pendingExpenseActions.delete(String(actionId || '').trim());
}

function extractActionIdFromMessage(message) {
  const match = String(message || '').match(/\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i);
  return match?.[1] || '';
}

function resolveActionDecision({ message, pendingActionId, actionDecision }) {
  const normalizedDecision = String(actionDecision || '').toLowerCase().trim();

  if (normalizedDecision === 'confirm' || normalizedDecision === 'cancel') {
    return {
      actionDecision: normalizedDecision,
      pendingActionId: String(pendingActionId || '').trim() || extractActionIdFromMessage(message),
    };
  }

  const normalizedMessage = normalizeText(message);
  let decision = '';

  if (/\bconfirmar\b/.test(normalizedMessage)) {
    decision = 'confirm';
  } else if (/\bcancelar\b|\bcancela\b|\banular\b|\banula\b/.test(normalizedMessage)) {
    decision = 'cancel';
  }

  if (!decision) {
    return null;
  }

  return {
    actionDecision: decision,
    pendingActionId: String(pendingActionId || '').trim() || extractActionIdFromMessage(message),
  };
}

function isCreateExpenseIntent(message) {
  const normalized = normalizeText(message);
  const hasVerb = /\bagrega\b|\bagregar\b|\banade\b|\banadir\b|\bregistra\b|\bregistrar\b|\bcrea\b|\bcrear\b/.test(normalized);
  const hasExpenseWord = /\bgasto\b|\begreso\b/.test(normalized);
  const hasAmountHint = /\$?\s*\d+(?:[.,]\d{1,2})?/.test(normalized);
  return hasVerb && (hasExpenseWord || hasAmountHint);
}

function extractAmount(message) {
  const rawMessage = String(message || '');
  const keyMatch = rawMessage.match(/(?:monto|por|de)\s*\$?\s*(-?\d+(?:[.,]\d{1,2})?)/i);
  const genericMatch = rawMessage.match(/\$\s*(-?\d+(?:[.,]\d{1,2})?)|(-?\d+(?:[.,]\d{1,2})?)\s*(?:mxn|cop|usd|eur)?/i);
  const rawValue = keyMatch?.[1] || genericMatch?.[1] || genericMatch?.[2] || '';
  return toAmount(rawValue);
}

function extractCategory(message) {
  const rawMessage = String(message || '');
  const explicitMatch = rawMessage.match(/(?:categoria|categor[i\u00ED]a)\s*(?:es|:)?\s*([a-zA-Z0-9\u00C0-\u024F\s-]{2,40})/i);
  if (explicitMatch?.[1]) {
    return normalizeCategoryName(explicitMatch[1]);
  }

  const normalizedMessage = normalizeText(rawMessage);
  const match = KNOWN_CATEGORIES.find((category) => normalizedMessage.includes(normalizeText(category)));
  return match || '';
}

function cleanDescription(value) {
  return String(value || '')
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function extractDescription(message) {
  const rawMessage = String(message || '');
  const explicitMatch = rawMessage.match(/(?:descripcion|descripci[o\u00F3]n)\s*(?:es|:)?\s*([^,;\n]+)/i);
  if (explicitMatch?.[1]) {
    return cleanDescription(explicitMatch[1]);
  }

  const inlineMatch = rawMessage.match(/\bgasto(?:\s+de)?\s+(.+?)\s+(?:por|de)\s*\$?\s*-?\d+(?:[.,]\d{1,2})?/i);
  if (inlineMatch?.[1]) {
    return cleanDescription(inlineMatch[1]);
  }

  return 'Gasto registrado desde chat';
}

function parseExpenseDraftFromMessage(message) {
  if (!isCreateExpenseIntent(message)) {
    return null;
  }

  const monto = extractAmount(message);
  const categoria = extractCategory(message);
  const descripcion = extractDescription(message);
  const missing = [];

  if (!monto) {
    missing.push('monto');
  }
  if (!categoria) {
    missing.push('categoria');
  }

  if (missing.length > 0) {
    return {
      intent: true,
      missing,
    };
  }

  return {
    intent: true,
    draft: {
      descripcion,
      monto,
      categoria,
    },
  };
}

function buildMissingFieldsReply(missing) {
  const lines = ['Puedo registrarlo, pero me faltan datos:'];

  if (missing.includes('monto')) {
    lines.push('- Monto (numero mayor que 0).');
  }
  if (missing.includes('categoria')) {
    lines.push('- Categoria (por ejemplo: Alimentacion, Transporte, Servicios).');
  }

  lines.push('Formato recomendado: Agrega gasto descripcion: Taxi, monto: 120, categoria: Transporte');
  return lines.join('\n');
}

function createSupabaseError(error, fallbackMessage, status = 500) {
  const result = new Error(error?.message || fallbackMessage);
  result.status = status;
  return result;
}

async function getUserExpenses(userId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('gastos')
      .select('id,descripcion,monto,categoria,fecha,created_at')
      .eq('user_id', userId)
      .order('id', { ascending: false })
      .limit(MAX_CONTEXT_EXPENSES);

    if (error) {
      throw createSupabaseError(error, 'No se pudieron obtener los gastos del usuario');
    }

    return data || [];
  }

  return fallbackChatExpenses
    .filter((item) => String(item.userId) === String(userId))
    .slice()
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
    .slice(0, MAX_CONTEXT_EXPENSES);
}

async function getUserBudgets(userId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('presupuestos')
      .select('id,categoria,monto,periodo,mes,anio')
      .eq('user_id', userId)
      .order('id', { ascending: false })
      .limit(MAX_CONTEXT_BUDGETS);

    if (error) {
      throw createSupabaseError(error, 'No se pudieron obtener los presupuestos del usuario');
    }

    return data || [];
  }

  return fallbackBudgets
    .filter((item) => String(item.userId) === String(userId))
    .slice(0, MAX_CONTEXT_BUDGETS);
}

function isDateInCurrentMonth(date, referenceDate) {
  return date.getMonth() === referenceDate.getMonth() && date.getFullYear() === referenceDate.getFullYear();
}

function buildBudgetSummary(currentMonthExpenses, budgets) {
  if (!Array.isArray(budgets) || budgets.length === 0) {
    return '- Presupuestos: sin datos.';
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const expenseByCategory = aggregateByCategory(currentMonthExpenses);

  const lines = [];

  for (const budget of budgets) {
    const budgetCategory = normalizeCategoryName(budget.categoria || 'Otros') || 'Otros';
    const budgetAmount = Number(budget.monto);
    if (!Number.isFinite(budgetAmount) || budgetAmount <= 0) {
      continue;
    }

    if (budget.periodo === 'mensual') {
      const budgetMonth = Number(budget.mes);
      const budgetYear = Number(budget.anio);
      if (budgetMonth !== currentMonth || budgetYear !== currentYear) {
        continue;
      }
    }

    const spent = Number(expenseByCategory[budgetCategory] || 0);
    const usage = Number(((spent / budgetAmount) * 100).toFixed(2));
    if (usage >= 80) {
      lines.push(`- Presupuesto ${budgetCategory}: ${usage}% usado (${formatCurrency(spent)} de ${formatCurrency(budgetAmount)}).`);
    }
  }

  if (lines.length === 0) {
    return '- Presupuestos: sin alertas de sobreuso.';
  }

  return lines.join('\n');
}

async function buildFinancialContextForUser(userId) {
  const expenses = await getUserExpenses(userId);
  const budgets = await getUserBudgets(userId);

  if (expenses.length === 0) {
    return [
      '- No hay gastos registrados todavia.',
      '- Recomienda empezar por registrar gastos diarios para personalizar consejos.',
    ].join('\n');
  }

  const now = new Date();
  const expensesWithDate = expenses.filter((item) => resolveDate(item.fecha || item.created_at));
  const currentMonthExpenses = expensesWithDate.filter((item) => {
    const date = resolveDate(item.fecha || item.created_at);
    return date ? isDateInCurrentMonth(date, now) : false;
  });

  const monthlyTotal = sumAmounts(currentMonthExpenses);
  const monthlyByCategory = aggregateByCategory(currentMonthExpenses);
  const topCategoryEntry = Object.entries(monthlyByCategory)
    .sort((a, b) => b[1] - a[1])[0];

  const recentExpenseLines = expenses.slice(0, 5).map((item) => {
    const category = normalizeCategoryName(item.categoria || 'Otros') || 'Otros';
    return `- ${category}: ${formatCurrency(item.monto)} (${item.descripcion || 'Sin descripcion'})`;
  });

  return [
    `- Gastos registrados: ${expenses.length}.`,
    `- Gasto del mes actual: ${formatCurrency(monthlyTotal)} en ${currentMonthExpenses.length} movimientos.`,
    topCategoryEntry
      ? `- Categoria principal del mes: ${topCategoryEntry[0]} (${formatCurrency(topCategoryEntry[1])}).`
      : '- Categoria principal del mes: sin datos suficientes.',
    buildBudgetSummary(currentMonthExpenses, budgets),
    '- Ultimos gastos:',
    ...recentExpenseLines,
  ].join('\n');
}

async function createExpenseForUser({ userId, draft }) {
  if (isSupabaseConfigured) {
    const payload = {
      descripcion: draft.descripcion,
      monto: draft.monto,
      categoria: draft.categoria,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('gastos')
      .insert(payload)
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      throw createSupabaseError(error, 'No se pudo crear el gasto desde el asistente', 400);
    }

    return data;
  }

  const nextId = fallbackChatExpenses.reduce((maxId, item) => {
    const itemId = Number(item.id);
    return Number.isFinite(itemId) ? Math.max(maxId, itemId) : maxId;
  }, 0) + 1;

  const created = {
    id: nextId,
    userId: String(userId),
    descripcion: draft.descripcion,
    monto: draft.monto,
    categoria: draft.categoria,
    fecha: new Date().toISOString(),
  };

  fallbackChatExpenses.push(created);
  return created;
}

function buildActionResponse(base) {
  return {
    createdAt: new Date().toISOString(),
    model: ACTION_MODEL,
    ...base,
  };
}

function buildPendingConfirmationReply({ user, draft, expiresAt }) {
  const username = user?.username ? String(user.username) : 'Usuario';
  const expiresInMinutes = Math.max(1, Math.round((expiresAt - Date.now()) / 60000));

  return [
    `${username}, detecte una solicitud para registrar un gasto:`,
    `- Descripcion: ${draft.descripcion}`,
    `- Monto: ${formatCurrency(draft.monto)}`,
    `- Categoria: ${draft.categoria}`,
    '',
    'Por seguridad necesito confirmacion antes de guardar.',
    '- Usa los botones Confirmar o Cancelar.',
    '- Tambien puedes escribir: CONFIRMAR o CANCELAR.',
    `Esta solicitud expira en ${expiresInMinutes} minuto(s).`,
  ].join('\n');
}

async function processExpenseActionFlow({ message, user, pendingActionId, actionDecision }) {
  const userId = user?.id ? String(user.id) : '';
  const decisionPayload = resolveActionDecision({ message, pendingActionId, actionDecision });

  if (decisionPayload) {
    const pendingAction = decisionPayload.pendingActionId
      ? getPendingExpenseAction(decisionPayload.pendingActionId, userId)
      : getLatestPendingExpenseAction(userId);

    if (!pendingAction) {
      return buildActionResponse({
        reply: 'No encontre una accion pendiente valida para confirmar. Puedes pedir de nuevo: "Agrega gasto ...".',
      });
    }

    if (decisionPayload.actionDecision === 'cancel') {
      deletePendingExpenseAction(pendingAction.id);
      return buildActionResponse({
        reply: 'Listo, cancele el registro del gasto pendiente.',
        actionResult: {
          type: 'create-expense',
          status: 'cancelled',
        },
      });
    }

    try {
      const createdExpense = await createExpenseForUser({
        userId,
        draft: pendingAction.draft,
      });

      deletePendingExpenseAction(pendingAction.id);

      return buildActionResponse({
        reply: [
          'Gasto registrado correctamente.',
          `- Descripcion: ${pendingAction.draft.descripcion}`,
          `- Monto: ${formatCurrency(pendingAction.draft.monto)}`,
          `- Categoria: ${pendingAction.draft.categoria}`,
        ].join('\n'),
        actionResult: {
          type: 'create-expense',
          status: 'confirmed',
          gastoId: createdExpense?.id,
        },
      });
    } catch (error) {
      return buildActionResponse({
        reply: `No pude guardar el gasto pendiente: ${error.message || 'error desconocido'}. Puedes volver a intentar confirmar.`,
        pendingAction: buildPendingActionDto(pendingAction),
      });
    }
  }

  const draftPayload = parseExpenseDraftFromMessage(message);
  if (!draftPayload) {
    return null;
  }

  if (draftPayload.missing?.length) {
    return buildActionResponse({
      reply: buildMissingFieldsReply(draftPayload.missing),
    });
  }

  const pendingAction = createPendingExpenseAction({
    userId,
    draft: draftPayload.draft,
  });

  return buildActionResponse({
    reply: buildPendingConfirmationReply({
      user,
      draft: pendingAction.draft,
      expiresAt: pendingAction.expiresAt,
    }),
    pendingAction: buildPendingActionDto(pendingAction),
  });
}

async function callGeminiApi({ model, apiKey, baseUrl, timeoutMs, contents }) {
  const endpoint = `${baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.35,
          topP: 0.9,
          maxOutputTokens: 700,
        },
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      let errorMessage = `Error al consultar Gemini (${response.status})`;

      try {
        const payload = await response.json();
        if (payload?.error?.message) {
          errorMessage = payload.error.message;
        }
      } catch {
        // Si no llega JSON de error, usamos mensaje por defecto.
      }

      const error = new Error(errorMessage);
      if (isGeminiQuotaExceeded(response.status, errorMessage)) {
        error.status = 429;
        error.code = 'GEMINI_QUOTA_EXCEEDED';
      } else {
        error.status = response.status === 429 ? 429 : 502;
      }
      throw error;
    }

    return response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error('Gemini no respondio dentro del tiempo esperado');
      timeoutError.status = 504;
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function parseGroqText(payload) {
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }

      return typeof part?.text === 'string' ? part.text : '';
    })
    .join('\n')
    .trim();
}

function sanitizeHistoryForGroq(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((item) => item && typeof item.content === 'string')
    .slice(-MAX_HISTORY_MESSAGES)
    .map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: item.content.trim().slice(0, MAX_HISTORY_MESSAGE_LENGTH),
    }))
    .filter((item) => item.content.length > 0);
}

async function callGroqApi({ model, apiKey, baseUrl, timeoutMs, messages }) {
  const endpoint = `${baseUrl}/chat/completions`;
  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.35,
        top_p: 0.9,
        max_tokens: 700,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      let errorMessage = `Error al consultar Groq (${response.status})`;

      try {
        const payload = await response.json();
        if (payload?.error?.message) {
          errorMessage = payload.error.message;
        }
      } catch {
        // Si no llega JSON de error, usamos mensaje por defecto.
      }

      const error = new Error(errorMessage);
      if (isGeminiQuotaExceeded(response.status, errorMessage)) {
        error.status = 429;
        error.code = 'GROQ_QUOTA_EXCEEDED';
      } else {
        error.status = response.status === 429 ? 429 : (response.status || 502);
      }

      throw error;
    }

    return response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error('Groq no respondio dentro del tiempo esperado');
      timeoutError.status = 504;
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

async function generateChatbotReply({
  message,
  history,
  user,
  pendingActionId,
  actionDecision,
}) {
  const geminiApiKey = String(process.env.GEMINI_API_KEY || '').trim();
  const geminiModel = String(process.env.GEMINI_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
  const geminiBaseUrl = String(process.env.GEMINI_API_BASE_URL || DEFAULT_BASE_URL).trim() || DEFAULT_BASE_URL;
  const groqApiKey = String(process.env.GROQ_API_KEY || '').trim();
  const groqModel = String(process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL).trim() || DEFAULT_GROQ_MODEL;
  const groqBaseUrl = String(process.env.GROQ_API_BASE_URL || DEFAULT_GROQ_BASE_URL).trim() || DEFAULT_GROQ_BASE_URL;
  const timeoutValue = Number(process.env.GEMINI_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const timeoutMs = Number.isFinite(timeoutValue) && timeoutValue > 0
    ? timeoutValue
    : DEFAULT_TIMEOUT_MS;

  const safeMessage = String(message || '').trim();
  const actionResponse = await processExpenseActionFlow({
    message: safeMessage,
    user,
    pendingActionId,
    actionDecision,
  });
  if (actionResponse) {
    return actionResponse;
  }

  if (!safeMessage) {
    const error = new Error('message es requerido');
    error.status = 400;
    throw error;
  }

  if (!geminiApiKey && !groqApiKey) {
    const error = new Error('No hay proveedor IA configurado en backend (GEMINI_API_KEY o GROQ_API_KEY)');
    error.status = 503;
    throw error;
  }

  let financialContext = '- Contexto no disponible por el momento.';
  const userId = user?.id ? String(user.id) : '';
  if (userId) {
    try {
      financialContext = await buildFinancialContextForUser(userId);
    } catch {
      financialContext = '- Contexto no disponible por un problema temporal al leer tus datos.';
    }
  }

  const prompt = buildPrompt(safeMessage, user, financialContext);
  const providerErrors = [];

  if (geminiApiKey) {
    try {
      const geminiPayload = await callGeminiApi({
        model: geminiModel,
        apiKey: geminiApiKey,
        baseUrl: geminiBaseUrl,
        timeoutMs,
        contents: [
          ...sanitizeHistory(history),
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      });

      const reply = parseGeminiText(geminiPayload);
      if (!reply) {
        const error = new Error('Gemini no devolvio una respuesta valida');
        error.status = 502;
        throw error;
      }

      return {
        reply,
        model: geminiModel,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      providerErrors.push(error);

      if (!groqApiKey || !shouldTrySecondaryProvider(error)) {
        if (error?.code === 'GEMINI_QUOTA_EXCEEDED') {
          return {
            reply: buildQuotaFallbackReply(user),
            model: FALLBACK_MODEL,
            createdAt: new Date().toISOString(),
          };
        }

        throw error;
      }
    }
  }

  if (groqApiKey) {
    try {
      const groqPayload = await callGroqApi({
        model: groqModel,
        apiKey: groqApiKey,
        baseUrl: groqBaseUrl,
        timeoutMs,
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente de control de gastos personales. Responde siempre en espanol claro y breve.',
          },
          ...sanitizeHistoryForGroq(history),
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const reply = parseGroqText(groqPayload);
      if (!reply) {
        const error = new Error('Groq no devolvio una respuesta valida');
        error.status = 502;
        throw error;
      }

      return {
        reply,
        model: `${GROQ_MODEL_PREFIX}${groqModel}`,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      providerErrors.push(error);

      if (error?.code === 'GROQ_QUOTA_EXCEEDED') {
        return {
          reply: buildQuotaFallbackReply(user),
          model: FALLBACK_MODEL,
          createdAt: new Date().toISOString(),
        };
      }
    }
  }

  const firstError = providerErrors[0];
  if (firstError) {
    throw firstError;
  }

  return {
    reply: buildQuotaFallbackReply(user),
    model: FALLBACK_MODEL,
    createdAt: new Date().toISOString(),
  };
}

function __resetChatActionStateForTests() {
  pendingExpenseActions.clear();
  fallbackChatExpenses.splice(0, fallbackChatExpenses.length, ...BASE_FALLBACK_EXPENSES.map((item) => ({ ...item })));
  fallbackBudgets.splice(0, fallbackBudgets.length, ...BASE_FALLBACK_BUDGETS.map((item) => ({ ...item })));
}

module.exports = {
  generateChatbotReply,
  __resetChatActionStateForTests,
};
