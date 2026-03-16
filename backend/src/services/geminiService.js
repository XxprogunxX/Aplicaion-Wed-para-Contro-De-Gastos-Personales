const { randomUUID } = require('crypto');
const { supabase, isSupabaseConfigured } = require('../config/supabase');
const {
  inferCategoryFromText: inferCanonicalCategoryFromText,
  normalizeCategory,
} = require('../utils/categoryNormalizer');

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
  'Bebidas',
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

const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
const MULTIPLE_EXPENSE_AMOUNT_REGEX = /\$?\s*-?\d+(?:[.,]\d{1,2})?\s*(?:pesos?|mxn)?/gi;
const MONTH_NAME_TO_NUMBER = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};
const MONTH_NUMBER_TO_LABEL = {
  1: 'enero',
  2: 'febrero',
  3: 'marzo',
  4: 'abril',
  5: 'mayo',
  6: 'junio',
  7: 'julio',
  8: 'agosto',
  9: 'septiembre',
  10: 'octubre',
  11: 'noviembre',
  12: 'diciembre',
};
const MONTH_NAME_REGEX_FRAGMENT = Object.keys(MONTH_NAME_TO_NUMBER).join('|');
const BUDGET_IGNORED_CATEGORY_WORDS = new Set([
  'mes',
  'anio',
  'ano',
  'periodo',
  'monto',
  'monto total',
  'categoria',
  'presupuesto',
  'presupuestos',
  'mensual',
  'anual',
  'crea',
  'crear',
  'configura',
  'configurar',
  'define',
  'establece',
]);

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

function formatDateLabel(value) {
  const date = resolveDate(value);
  if (!date) {
    return '';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

function resolveDate(value) {
  if (!value) {
    return null;
  }

  const rawDate = String(value).trim();
  const dateOnlyMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);

    const localDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (
      localDate.getFullYear() === year
      && localDate.getMonth() === month - 1
      && localDate.getDate() === day
    ) {
      return localDate;
    }
  }

  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildLocalDate(year, month, day) {
  const safeYear = Number(year);
  const safeMonth = Number(month);
  const safeDay = Number(day);

  if (!Number.isInteger(safeYear) || !Number.isInteger(safeMonth) || !Number.isInteger(safeDay)) {
    return null;
  }

  if (safeMonth < 1 || safeMonth > 12 || safeDay < 1 || safeDay > 31) {
    return null;
  }

  // Usamos mediodia local para evitar desfaces por zona horaria al serializar a ISO.
  const result = new Date(safeYear, safeMonth - 1, safeDay, 12, 0, 0, 0);

  if (
    result.getFullYear() !== safeYear
    || result.getMonth() !== safeMonth - 1
    || result.getDate() !== safeDay
  ) {
    return null;
  }

  return result;
}

function addDaysToDate(referenceDate, dayOffset) {
  const baseDate = resolveDate(referenceDate) || new Date();
  const shifted = new Date(baseDate);
  shifted.setDate(shifted.getDate() + Number(dayOffset || 0));

  return buildLocalDate(
    shifted.getFullYear(),
    shifted.getMonth() + 1,
    shifted.getDate()
  );
}

function buildEndOfMonthDate(referenceDate, monthOffset = 0) {
  const baseDate = resolveDate(referenceDate) || new Date();
  const targetDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth() + Number(monthOffset || 0) + 1,
    0,
    12,
    0,
    0,
    0
  );

  return buildLocalDate(
    targetDate.getFullYear(),
    targetDate.getMonth() + 1,
    targetDate.getDate()
  );
}

function isLikelyDateToken({ message, start, end, numericValue, hasCurrencyHint }) {
  if (!Number.isFinite(numericValue) || hasCurrencyHint) {
    return false;
  }

  const beforeRaw = String(message || '').slice(Math.max(0, start - 24), start);
  const afterRaw = String(message || '').slice(end, Math.min(String(message || '').length, end + 28));
  const before = normalizeText(beforeRaw);
  const after = normalizeText(afterRaw);

  // Formatos como 12/03/2026 o 12-03-2026.
  if (/[\/-]\s*$/.test(before) || /^\s*[\/-]/.test(after)) {
    return true;
  }

  // Ano dentro de una referencia temporal.
  if (numericValue >= 1900 && numericValue <= 2100) {
    if (/\b(?:en|de)\s*$/.test(before) || /^\s*(?:d|del)\b/.test(after)) {
      return true;
    }
  }

  // Dia de mes: "5 de marzo".
  if (numericValue >= 1 && numericValue <= 31) {
    const monthAheadRegex = new RegExp(`^\\s*(?:de\\s+)?(?:${MONTH_NAME_REGEX_FRAGMENT})\\b`);
    const dayThenMonthRegex = new RegExp(`^\\s*de\\s+(?:${MONTH_NAME_REGEX_FRAGMENT})\\b`);
    if ((/\bde\s*$/.test(before) && monthAheadRegex.test(after)) || dayThenMonthRegex.test(after)) {
      return true;
    }
  }

  // Mes numerico: "mes 3" o "mes de 3".
  if (numericValue >= 1 && numericValue <= 12 && /\bmes\s*(?:de)?\s*$/.test(before)) {
    return true;
  }

  return false;
}

function collectAmountCandidates(message) {
  const rawMessage = String(message || '');
  const amountRegex = new RegExp(MULTIPLE_EXPENSE_AMOUNT_REGEX);
  const candidates = [];
  let match = amountRegex.exec(rawMessage);

  while (match) {
    const rawAmount = match[0] || '';
    const numericMatch = rawAmount.match(/-?\d+(?:[.,]\d{1,2})?/);
    const monto = toAmount(numericMatch?.[0] || '');
    const hasCurrencyHint = /\$|pesos?|mxn/i.test(rawAmount);

    if (monto) {
      const start = match.index;
      const end = match.index + rawAmount.length;
      if (!isLikelyDateToken({
        message: rawMessage,
        start,
        end,
        numericValue: Number(numericMatch?.[0]?.replace(',', '.')),
        hasCurrencyHint,
      })) {
        candidates.push({
          monto,
          start,
          end,
          hasCurrencyHint,
        });
      }
    }

    match = amountRegex.exec(rawMessage);
  }

  return candidates;
}

function collectExpenseDateCandidates(text, referenceDate = new Date()) {
  const rawText = String(text || '');
  const normalized = normalizeText(rawText)
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const baseDate = resolveDate(referenceDate) || new Date();
  const baseYear = baseDate.getFullYear();
  const candidates = [];

  if (!normalized) {
    return candidates;
  }

  const ymdRegex = /\b(20\d{2})[\/-](\d{1,2})[\/-](\d{1,2})\b/g;
  let ymdMatch = ymdRegex.exec(normalized);
  while (ymdMatch) {
    const candidateDate = buildLocalDate(ymdMatch[1], ymdMatch[2], ymdMatch[3]);
    if (candidateDate) {
      candidates.push({ index: ymdMatch.index, date: candidateDate });
    }
    ymdMatch = ymdRegex.exec(normalized);
  }

  const dmyRegex = /\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](20\d{2}))?\b/g;
  let dmyMatch = dmyRegex.exec(normalized);
  while (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3] || baseYear);

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const candidateDate = buildLocalDate(year, month, day);
      if (candidateDate) {
        candidates.push({ index: dmyMatch.index, date: candidateDate });
      }
    }

    dmyMatch = dmyRegex.exec(normalized);
  }

  const dayMonthRegex = new RegExp(`\\b(?:el\\s+)?(\\d{1,2})\\s+de\\s+(${MONTH_NAME_REGEX_FRAGMENT})(?:\\s+de\\s+(20\\d{2}))?\\b`, 'g');
  let dayMonthMatch = dayMonthRegex.exec(normalized);
  while (dayMonthMatch) {
    const day = Number(dayMonthMatch[1]);
    const month = Number(MONTH_NAME_TO_NUMBER[dayMonthMatch[2]]);
    const year = Number(dayMonthMatch[3] || baseYear);
    const candidateDate = buildLocalDate(year, month, day);
    if (candidateDate) {
      candidates.push({ index: dayMonthMatch.index, date: candidateDate });
    }
    dayMonthMatch = dayMonthRegex.exec(normalized);
  }

  const monthOnlyRegex = new RegExp(`\\b(?:en\\s+)?(${MONTH_NAME_REGEX_FRAGMENT})(?:\\s+de\\s+(20\\d{2})|\\s+(20\\d{2}))?\\b`, 'g');
  let monthOnlyMatch = monthOnlyRegex.exec(normalized);
  while (monthOnlyMatch) {
    const beforeMonth = normalized.slice(Math.max(0, monthOnlyMatch.index - 12), monthOnlyMatch.index);
    if (/\b\d{1,2}\s+de\s*$/.test(beforeMonth)) {
      monthOnlyMatch = monthOnlyRegex.exec(normalized);
      continue;
    }

    const month = Number(MONTH_NAME_TO_NUMBER[monthOnlyMatch[1]]);
    const year = Number(monthOnlyMatch[2] || monthOnlyMatch[3] || baseYear);
    const candidateDate = buildLocalDate(year, month, 1);
    if (candidateDate) {
      candidates.push({ index: monthOnlyMatch.index, date: candidateDate });
    }

    monthOnlyMatch = monthOnlyRegex.exec(normalized);
  }

  const mesPasadoRegex = /\bmes\s+pasado\b/g;
  let mesPasadoMatch = mesPasadoRegex.exec(normalized);
  while (mesPasadoMatch) {
    const prevMonthDate = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1, 12, 0, 0, 0);
    candidates.push({ index: mesPasadoMatch.index, date: prevMonthDate });
    mesPasadoMatch = mesPasadoRegex.exec(normalized);
  }

  const esteMesRegex = /\beste\s+mes\b/g;
  let esteMesMatch = esteMesRegex.exec(normalized);
  while (esteMesMatch) {
    const thisMonthDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 12, 0, 0, 0);
    candidates.push({ index: esteMesMatch.index, date: thisMonthDate });
    esteMesMatch = esteMesRegex.exec(normalized);
  }

  const nextMonthRegex = /\b(?:proximo\s+mes|siguiente\s+mes|mes\s+que\s+viene)\b/g;
  let nextMonthMatch = nextMonthRegex.exec(normalized);
  while (nextMonthMatch) {
    const nextMonthDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1, 12, 0, 0, 0);
    candidates.push({ index: nextMonthMatch.index, date: nextMonthDate });
    nextMonthMatch = nextMonthRegex.exec(normalized);
  }

  const semanaPasadaRegex = /\b(?:la\s+)?semana\s+pasada\b/g;
  let semanaPasadaMatch = semanaPasadaRegex.exec(normalized);
  while (semanaPasadaMatch) {
    const lastWeekDate = addDaysToDate(baseDate, -7);
    if (lastWeekDate) {
      candidates.push({ index: semanaPasadaMatch.index, date: lastWeekDate });
    }
    semanaPasadaMatch = semanaPasadaRegex.exec(normalized);
  }

  const quincenaPasadaRegex = /\b(?:la\s+)?quincena\s+pasada\b/g;
  let quincenaPasadaMatch = quincenaPasadaRegex.exec(normalized);
  while (quincenaPasadaMatch) {
    const lastFortnightDate = addDaysToDate(baseDate, -15);
    if (lastFortnightDate) {
      candidates.push({ index: quincenaPasadaMatch.index, date: lastFortnightDate });
    }
    quincenaPasadaMatch = quincenaPasadaRegex.exec(normalized);
  }

  const endOfPreviousMonthRegex = /\b(?:a\s+)?(?:fin|final)\s+de\s+mes\s+pasado\b/g;
  let endOfPreviousMonthMatch = endOfPreviousMonthRegex.exec(normalized);
  while (endOfPreviousMonthMatch) {
    const endOfPreviousMonthDate = buildEndOfMonthDate(baseDate, -1);
    if (endOfPreviousMonthDate) {
      candidates.push({ index: endOfPreviousMonthMatch.index, date: endOfPreviousMonthDate });
    }
    endOfPreviousMonthMatch = endOfPreviousMonthRegex.exec(normalized);
  }

  const endOfNextMonthRegex = /\b(?:a\s+)?(?:fin|final)\s+de\s+(?:(?:proximo|siguiente)\s+mes|mes\s+que\s+viene)\b/g;
  let endOfNextMonthMatch = endOfNextMonthRegex.exec(normalized);
  while (endOfNextMonthMatch) {
    const endOfNextMonthDate = buildEndOfMonthDate(baseDate, 1);
    if (endOfNextMonthDate) {
      candidates.push({ index: endOfNextMonthMatch.index, date: endOfNextMonthDate });
    }
    endOfNextMonthMatch = endOfNextMonthRegex.exec(normalized);
  }

  const endOfCurrentMonthRegex = /\b(?:a\s+)?(?:fin|final)\s+de\s+(?:este\s+)?mes\b(?!\s+(?:pasado|que\s+viene))/g;
  let endOfCurrentMonthMatch = endOfCurrentMonthRegex.exec(normalized);
  while (endOfCurrentMonthMatch) {
    const endOfCurrentMonthDate = buildEndOfMonthDate(baseDate, 0);
    if (endOfCurrentMonthDate) {
      candidates.push({ index: endOfCurrentMonthMatch.index, date: endOfCurrentMonthDate });
    }
    endOfCurrentMonthMatch = endOfCurrentMonthRegex.exec(normalized);
  }

  const relativeRegexConfigs = [
    { regex: /\bpasado\s+manana\b/g, dayOffset: 2 },
    { regex: /\b(?:anteayer|antier)\b/g, dayOffset: -2 },
    { regex: /\bayer\b/g, dayOffset: -1 },
    { regex: /\bhoy\b/g, dayOffset: 0 },
  ];

  for (const { regex, dayOffset } of relativeRegexConfigs) {
    let relativeMatch = regex.exec(normalized);
    while (relativeMatch) {
      const candidateDate = addDaysToDate(baseDate, dayOffset);
      if (candidateDate) {
        candidates.push({ index: relativeMatch.index, date: candidateDate });
      }
      relativeMatch = regex.exec(normalized);
    }
  }

  const mananaRegex = /\bmanana\b/g;
  let mananaMatch = mananaRegex.exec(normalized);
  while (mananaMatch) {
    const beforeManana = normalized.slice(Math.max(0, mananaMatch.index - 12), mananaMatch.index);
    if (!/\bpasado\s+$/.test(beforeManana)) {
      const candidateDate = addDaysToDate(baseDate, 1);
      if (candidateDate) {
        candidates.push({ index: mananaMatch.index, date: candidateDate });
      }
    }
    mananaMatch = mananaRegex.exec(normalized);
  }

  const daysAgoRegex = /\bhace\s+(\d{1,2})\s+dias\b/g;
  let daysAgoMatch = daysAgoRegex.exec(normalized);
  while (daysAgoMatch) {
    const dayOffset = -Number(daysAgoMatch[1]);
    const candidateDate = addDaysToDate(baseDate, dayOffset);
    if (candidateDate) {
      candidates.push({ index: daysAgoMatch.index, date: candidateDate });
    }
    daysAgoMatch = daysAgoRegex.exec(normalized);
  }

  const inDaysRegex = /\ben\s+(\d{1,2})\s+dias\b/g;
  let inDaysMatch = inDaysRegex.exec(normalized);
  while (inDaysMatch) {
    const dayOffset = Number(inDaysMatch[1]);
    const candidateDate = addDaysToDate(baseDate, dayOffset);
    if (candidateDate) {
      candidates.push({ index: inDaysMatch.index, date: candidateDate });
    }
    inDaysMatch = inDaysRegex.exec(normalized);
  }

  return candidates;
}

function resolveExpenseDateFromText(text, options = {}) {
  const referenceDate = resolveDate(options.referenceDate) || new Date();
  const prefer = options.prefer === 'first' ? 'first' : 'last';
  const candidates = collectExpenseDateCandidates(text, referenceDate)
    .sort((a, b) => a.index - b.index);

  if (candidates.length === 0) {
    return null;
  }

  return prefer === 'first'
    ? candidates[0].date
    : candidates[candidates.length - 1].date;
}

function resolveExpenseDateFromContext({ beforeText, afterText, fallbackDate, referenceDate }) {
  const safeReferenceDate = resolveDate(referenceDate) || new Date();
  const fromBefore = resolveExpenseDateFromText(beforeText, {
    referenceDate: safeReferenceDate,
    prefer: 'last',
  });

  if (fromBefore) {
    return fromBefore;
  }

  const fromAfter = resolveExpenseDateFromText(afterText, {
    referenceDate: safeReferenceDate,
    prefer: 'first',
  });

  if (fromAfter) {
    return fromAfter;
  }

  return resolveDate(fallbackDate) || safeReferenceDate;
}

function sumAmounts(items) {
  return (items || []).reduce((total, item) => {
    const amount = Number(item?.monto);
    return Number.isFinite(amount) ? total + amount : total;
  }, 0);
}

function aggregateByCategory(items) {
  return (items || []).reduce((acc, item) => {
    const category = normalizeCategory(item?.categoria, item?.descripcion || '');
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

function sanitizeAssistantMarkdown(text) {
  const rawText = String(text || '');

  if (!rawText) {
    return '';
  }

  return rawText
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/^\s*\*\s+/gm, '- ')
    .replace(/^\s*\+\s+/gm, '- ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseGeminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return '';
  }

  return sanitizeAssistantMarkdown(
    parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('\n')
    .trim()
  );
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

  const expenseDate = action.draft?.fecha ? resolveDate(action.draft.fecha) : null;

  return {
    id: action.id,
    type: 'create-expense',
    descripcion: action.draft.descripcion,
    monto: action.draft.monto,
    categoria: action.draft.categoria,
    ...(expenseDate ? { fecha: expenseDate.toISOString() } : {}),
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

function createPendingExpenseAction({ userId, draft, replaceExisting = true, groupId = '' }) {
  cleanupExpiredPendingActions();
  if (replaceExisting) {
    clearPendingActionsForUser(userId);
  }

  const createdAt = Date.now();
  const action = {
    id: randomUUID(),
    userId: String(userId),
    draft,
    groupId: groupId ? String(groupId) : '',
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

function getPendingActionsByGroup(groupId, userId) {
  cleanupExpiredPendingActions();
  const safeGroupId = String(groupId || '').trim();
  const safeUserId = String(userId || '').trim();

  if (!safeGroupId || !safeUserId) {
    return [];
  }

  return Array.from(pendingExpenseActions.values())
    .filter((action) => (
      String(action.groupId || '') === safeGroupId
      && String(action.userId) === safeUserId
      && action.expiresAt > Date.now()
    ))
    .sort((a, b) => a.createdAt - b.createdAt);
}

function getPendingActionBatch(anchorAction, userId) {
  if (!anchorAction) {
    return [];
  }

  const groupedActions = getPendingActionsByGroup(anchorAction.groupId, userId);
  if (groupedActions.length > 0) {
    return groupedActions;
  }

  return [anchorAction];
}

function deletePendingExpenseActions(actions) {
  for (const action of actions || []) {
    deletePendingExpenseAction(action.id);
  }
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

function isLikelyExpenseSummaryQuestion(message, options = {}) {
  const rawMessage = String(message || '').trim();
  const normalized = normalizeText(rawMessage);

  if (!normalized) {
    return false;
  }

  const hasQuestionTone = /\?/.test(rawMessage)
    || /\b(cuanto|cual|que|como|cuando|donde|por\s+que|porque)\b/.test(normalized);

  const hasHistoricalSummaryPhrase = /\b(cuanto\s+me\s+gaste|cuanto\s+llevo\s+gastado|llevo\s+gastado|he\s+gastado|cuanto\s+va\s+de\s+gasto|como\s+voy\s+de\s+gastos?)\b/.test(normalized);

  const hasPeriodHint = /\b(esta\s+semana|este\s+mes|esta\s+quincena|semana|mes|quincena|anio|ano|hoy|ayer)\b/.test(normalized)
    || new RegExp(`\\b(${MONTH_NAME_REGEX_FRAGMENT})\\b`).test(normalized);

  if (!hasQuestionTone && !hasHistoricalSummaryPhrase) {
    return false;
  }

  const hasSummaryHint = /\b(total|gastado|gaste|gasto|gastos|reporte|resumen|comparativo|mes|anio|ano|semana|quincena)\b/.test(normalized)
    || hasPeriodHint;

  if (!hasSummaryHint) {
    return false;
  }

  const hasExplicitCreateVerb = options.hasExplicitCreateVerb === true;
  const hasAmountCandidate = options.hasAmountCandidate === true;

  return !hasExplicitCreateVerb && !hasAmountCandidate;
}

function isCreateExpenseIntent(message) {
  const rawMessage = String(message || '');
  const normalized = normalizeText(rawMessage);
  const hasBudgetWord = /\bpresupuesto(?:s)?\b/.test(normalized);
  const hasExplicitCreateVerb = /\bagrega\b|\bagregar\b|\banade\b|\banadir\b|\bregistra\b|\bregistrar\b|\bcrea\b|\bcrear\b/.test(normalized);
  const hasSpendingVerb = /\bgaste\b|\bgastar\b|\bgastarme\b|\bgastare\b|\bme\s+gaste\b|\bme\s+vole\b|\bse\s+me\s+fueron\b|\bcompre\b|\bcomprar\b|\bpague\b|\bpagar\b|\bpretendo\b|\bpienso\b|\bplaneo\b/.test(normalized);
  const hasExpenseWord = /\bgasto\b|\begreso\b/.test(normalized);
  const hasAmountCandidate = collectAmountCandidates(rawMessage).length > 0;

  if (hasBudgetWord) {
    return false;
  }

  // Evita confundir preguntas de consulta ("cuanto gaste en enero") con altas de gasto.
  if (isLikelyExpenseSummaryQuestion(rawMessage, { hasExplicitCreateVerb, hasAmountCandidate })) {
    return false;
  }

  if (hasExplicitCreateVerb) {
    return hasExpenseWord || hasAmountCandidate;
  }

  if (hasSpendingVerb) {
    return hasAmountCandidate;
  }

  return false;
}

function isCreateBudgetIntent(message) {
  const normalized = normalizeText(message);
  const hasBudgetWord = /\bpresupuesto(?:s)?\b/.test(normalized);
  const hasVerb = /\bcrea\b|\bcrear\b|\bagrega\b|\bagregar\b|\bregistra\b|\bregistrar\b|\bconfigura\b|\bconfigurar\b|\bdefine\b|\bestablece\b|\basigna\b|\bajusta\b/.test(normalized);
  const hasAmountHint = /\$?\s*\d+(?:[.,]\d{1,2})?/.test(normalized);
  const hasListStyle = /[:=]\s*\$?\s*\d+(?:[.,]\d{1,2})?/.test(normalized);

  return hasBudgetWord && hasAmountHint && (hasVerb || hasListStyle);
}

function extractBudgetPeriod(message) {
  const normalized = normalizeText(message);
  if (/\banual\b|\ba(?:n|ñ)o\b/.test(normalized)) {
    return 'anual';
  }

  return 'mensual';
}

function extractBudgetYear(message) {
  const nowYear = new Date().getFullYear();
  const yearMatch = String(message || '').match(/\b(20\d{2})\b/);
  const year = Number(yearMatch?.[1]);

  if (Number.isFinite(year) && year >= 2000 && year <= 2100) {
    return year;
  }

  return nowYear;
}

function extractBudgetMonth(message, period) {
  if (period !== 'mensual') {
    return null;
  }

  const currentMonth = new Date().getMonth() + 1;
  const rawMessage = String(message || '');
  const numericMatch = rawMessage.match(/\bmes\s*(?:de)?\s*(\d{1,2})\b/i);
  const numericMonth = Number(numericMatch?.[1]);
  if (Number.isFinite(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
    return numericMonth;
  }

  const normalized = normalizeText(rawMessage);
  for (const [monthName, monthNumber] of Object.entries(MONTH_NAME_TO_NUMBER)) {
    const monthRegex = new RegExp(`\\b${monthName}\\b`);
    if (monthRegex.test(normalized)) {
      return monthNumber;
    }
  }

  return currentMonth;
}

function cleanBudgetCategoryLabel(value) {
  const cleaned = String(value || '')
    .replace(/^[\s\-_*•]+/g, '')
    .replace(/\bpresupuesto(?:s)?\b/gi, '')
    .replace(/\binicial(?:es)?\b/gi, '')
    .replace(/^(?:de|para)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  const normalized = normalizeText(cleaned);
  if (!normalized || BUDGET_IGNORED_CATEGORY_WORDS.has(normalized)) {
    return '';
  }

  return normalizeCategory(cleaned, cleaned);
}

function pickBudgetCategoryFromMessage(message) {
  const rawMessage = String(message || '');
  const explicitCategory = extractCategory(rawMessage);
  if (explicitCategory) {
    return explicitCategory;
  }

  const budgetPrepositionMatch = rawMessage.match(/presupuesto(?:s)?\s+(?:de|para)\s+([a-zA-Z0-9\u00C0-\u024F\s-]{2,40})/i);
  if (budgetPrepositionMatch?.[1]) {
    return cleanBudgetCategoryLabel(budgetPrepositionMatch[1]);
  }

  const normalizedMessage = normalizeText(rawMessage);
  const knownCategory = KNOWN_CATEGORIES.find((category) => normalizedMessage.includes(normalizeText(category)));
  return knownCategory ? normalizeCategory(knownCategory, rawMessage) : '';
}

function extractBudgetDrafts(message) {
  const rawMessage = String(message || '');
  if (!rawMessage.trim() || !isCreateBudgetIntent(rawMessage)) {
    return [];
  }

  const period = extractBudgetPeriod(rawMessage);
  const year = extractBudgetYear(rawMessage);
  const month = extractBudgetMonth(rawMessage, period);
  const periodMonth = period === 'mensual' ? month : null;

  const budgetDrafts = [];
  const budgetsListPrefix = rawMessage.match(/presupuesto(?:s)?[^:]{0,40}:\s*/i);
  const parseTarget = budgetsListPrefix
    ? rawMessage.slice((budgetsListPrefix.index || 0) + budgetsListPrefix[0].length)
    : rawMessage;
  const pairRegex = /([a-zA-Z\u00C0-\u024F][a-zA-Z0-9\u00C0-\u024F\s-]{1,40}?)\s*[:=]\s*\$?\s*(-?\d+(?:[.,]\d{1,2})?)/g;
  let pairMatch = pairRegex.exec(parseTarget);

  while (pairMatch) {
    const categoria = cleanBudgetCategoryLabel(pairMatch[1]);
    const monto = toAmount(pairMatch[2]);

    if (categoria && monto) {
      budgetDrafts.push({
        categoria,
        monto,
        periodo: period,
        mes: periodMonth,
        anio: year,
      });
    }

    pairMatch = pairRegex.exec(parseTarget);
  }

  if (budgetDrafts.length > 0) {
    return budgetDrafts;
  }

  const monto = extractAmount(rawMessage);
  const categoria = pickBudgetCategoryFromMessage(rawMessage);
  if (!monto || !categoria) {
    return [];
  }

  return [{
    categoria,
    monto,
    periodo: period,
    mes: periodMonth,
    anio: year,
  }];
}

function extractAmount(message) {
  const candidates = collectAmountCandidates(message);
  if (candidates.length === 0) {
    return null;
  }

  const bestCandidate = candidates.find((item) => item.hasCurrencyHint) || candidates[0];
  return bestCandidate.monto;
}

function extractCategory(message) {
  const rawMessage = String(message || '');
  const explicitMatch = rawMessage.match(/(?:categoria|categor[i\u00ED]a)\s*(?:es|:)?\s*([a-zA-Z0-9\u00C0-\u024F\s-]{2,40})/i);
  if (explicitMatch?.[1]) {
    return normalizeCategory(explicitMatch[1], rawMessage);
  }

  const normalizedMessage = normalizeText(rawMessage);
  const match = KNOWN_CATEGORIES.find((category) => normalizedMessage.includes(normalizeText(category)));
  return match ? normalizeCategory(match, rawMessage) : '';
}

function inferCategoryFromText(value) {
  return inferCanonicalCategoryFromText(value) || 'Otros';
}

function cleanupExpenseDescription(value) {
  let result = String(value || '')
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  result = result
    .replace(/^(?:en|de|del|para|por)\s+/i, '')
    .replace(/(?:,|;|\.|!|\?|:)\s*$/g, '')
    .replace(/\b(?:y|e)\s*$/i, '')
    .trim();

  result = result
    .replace(/^(?:la|el|los|las|un|una|unos|unas)\s+/i, '')
    .replace(/^(?:me|se|mi|mis)\s+/i, '')
    .trim();

  return result.slice(0, 120);
}

function extractDescriptionAfterAmount(afterText) {
  const cleaned = String(afterText || '')
    .replace(/^\s*(?:pesos?|mxn)\b/i, '')
    .replace(/^\s*(?:en|de|del|para|por)\s+/i, '')
    .trim();

  if (!cleaned) {
    return '';
  }

  const chunk = cleaned.split(
    /(?:,|;|\.|!|\?|\s+\by\b\s+|\s+\be\b\s+|\bel\s+dia\s+de\b|\bhoy\b|\bayer\b|\bmanana\b|\bpasado\s+manana\b|\banteayer\b|\bantier\b|\b(?:la\s+)?semana\s+pasada\b|\b(?:la\s+)?quincena\s+pasada\b|\b(?:a\s+)?(?:fin|final)\s+de\s+(?:este\s+)?mes\b|\b(?:a\s+)?(?:fin|final)\s+de\s+mes\s+pasado\b|\b(?:a\s+)?(?:fin|final)\s+de\s+(?:proximo|siguiente)\s+mes\b|\b(?:a\s+)?(?:fin|final)\s+de\s+mes\s+que\s+viene\b|\bpretendo\b|\bpienso\b|\bplaneo\b)/i
  )[0] || '';
  return cleanupExpenseDescription(chunk);
}

function extractDescriptionBeforeAmount(beforeText) {
  let cleaned = String(beforeText || '')
    .replace(/(?:,|;|:)+\s*$/g, '')
    .trim();

  if (!cleaned) {
    return '';
  }

  cleaned = cleaned.replace(/\b(?:por|de|en|para)\s*$/i, '').trim();

  const spendingVerbMatch = cleaned.match(
    /(?:\bgaste\b|\bgast[eé]\b|\bgastarme\b|\bgastare\b|\bme\s+gaste\b|\bme\s+vol[eé]\b|\bse\s+me\s+fueron\b|\bcompr[eé]\b|\bcompre\b|\bpagu[eé]\b|\bpague\b|\bpretendo\s+gastar\b|\bpretendo\s+gastarme\b|\bpienso\s+gastar\b|\bplaneo\s+gastar\b)\s+(.+)$/i
  );
  if (spendingVerbMatch?.[1]) {
    return cleanupExpenseDescription(spendingVerbMatch[1]);
  }

  const trailingPrepositionMatch = cleaned.match(/(?:en|de|del|para)\s+([^,;]+)$/i);
  if (trailingPrepositionMatch?.[1]) {
    return cleanupExpenseDescription(trailingPrepositionMatch[1]);
  }

  const tailWords = cleaned.split(/\s+/).slice(-4).join(' ');
  return cleanupExpenseDescription(tailWords);
}

function extractDescriptionNearAmount({ beforeText, afterText }) {
  const fromAfter = extractDescriptionAfterAmount(afterText);
  if (fromAfter) {
    return fromAfter;
  }

  const fromBefore = extractDescriptionBeforeAmount(beforeText);
  if (fromBefore) {
    return fromBefore;
  }

  return '';
}

function formatPendingExpenseLine(index, draft) {
  const emoji = NUMBER_EMOJIS[index] || `${index + 1}.`;
  const label = String(draft?.descripcion || 'Gasto').trim();
  const description = label.charAt(0).toUpperCase() + label.slice(1);
  const dateLabel = formatDateLabel(draft?.fecha);
  return dateLabel
    ? `${emoji} ${description} — ${formatCurrency(draft.monto)} (${dateLabel})`
    : `${emoji} ${description} — ${formatCurrency(draft.monto)}`;
}

function buildMultiplePendingConfirmationReply(drafts) {
  const lines = [`Detecte ${drafts.length} gastos en tu mensaje:`];

  drafts.forEach((draft, index) => {
    lines.push(formatPendingExpenseLine(index, draft));
  });

  lines.push('');
  lines.push('Confirma para registrarlos.');

  return lines.join('\n');
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

function extractMultipleExpenses(message) {
  const rawMessage = String(message || '');
  if (!rawMessage.trim() || !isCreateExpenseIntent(rawMessage)) {
    return [];
  }

  const amountMatches = collectAmountCandidates(rawMessage);

  if (amountMatches.length === 0) {
    return [];
  }

  const referenceDate = new Date();
  const fallbackDate = resolveExpenseDateFromText(rawMessage, {
    referenceDate,
    prefer: 'first',
  }) || referenceDate;

  return amountMatches
    .map((amountMatch, index) => {
      const prevEnd = index === 0 ? 0 : amountMatches[index - 1].end;
      const nextStart = index === amountMatches.length - 1
        ? rawMessage.length
        : amountMatches[index + 1].start;

      const chunk = rawMessage.slice(prevEnd, nextStart);
      const amountStartInChunk = amountMatch.start - prevEnd;
      const amountEndInChunk = amountMatch.end - prevEnd;

      const beforeText = chunk.slice(0, amountStartInChunk);
      const afterText = chunk.slice(amountEndInChunk);

      const descripcion = extractDescriptionNearAmount({ beforeText, afterText }) || 'Gasto registrado desde chat';
      const categoria = inferCategoryFromText(descripcion);
      const fecha = resolveExpenseDateFromContext({
        beforeText,
        afterText,
        fallbackDate,
        referenceDate,
      });

      return {
        descripcion,
        monto: amountMatch.monto,
        categoria,
        fecha: fecha.toISOString(),
      };
    })
    .filter((item) => item.monto > 0);
}

function parseExpenseDraftFromMessage(message) {
  if (!isCreateExpenseIntent(message)) {
    return null;
  }

  const monto = extractAmount(message);
  const categoria = extractCategory(message);
  const descripcion = extractDescription(message);
  const parsedDate = resolveExpenseDateFromText(message, {
    referenceDate: new Date(),
    prefer: 'last',
  }) || new Date();
  const categoriaInferida = normalizeCategory(
    categoria || inferCategoryFromText(`${descripcion} ${message}`),
    `${descripcion} ${message}`
  );
  const missing = [];

  if (!monto) {
    missing.push('monto');
  }
  if (!categoriaInferida) {
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
      categoria: categoriaInferida || 'Otros',
      fecha: parsedDate.toISOString(),
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
    const budgetCategory = normalizeCategory(budget.categoria, '') || 'Otros';
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

  const currentYear = now.getFullYear();
  const annualTotalsByMonth = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
  };

  for (const item of expensesWithDate) {
    const date = resolveDate(item.fecha || item.created_at);
    if (!date || date.getFullYear() !== currentYear) {
      continue;
    }

    const month = date.getMonth() + 1;
    annualTotalsByMonth[month] += toAmount(item.monto) || 0;
  }

  const annualBreakdownLines = Object.entries(annualTotalsByMonth)
    .map(([monthKey, total]) => ({
      month: Number(monthKey),
      total: Number(total || 0),
    }))
    .sort((a, b) => a.month - b.month)
    .map((item) => `- ${MONTH_NUMBER_TO_LABEL[item.month]} ${currentYear}: ${formatCurrency(item.total)}.`);

  const recentExpenseLines = expenses.slice(0, 5).map((item) => {
    const category = normalizeCategory(item.categoria, item.descripcion || '') || 'Otros';
    return `- ${category}: ${formatCurrency(item.monto)} (${item.descripcion || 'Sin descripcion'})`;
  });

  return [
    `- Gastos registrados: ${expenses.length}.`,
    `- Gasto del mes actual: ${formatCurrency(monthlyTotal)} en ${currentMonthExpenses.length} movimientos.`,
    topCategoryEntry
      ? `- Categoria principal del mes: ${topCategoryEntry[0]} (${formatCurrency(topCategoryEntry[1])}).`
      : '- Categoria principal del mes: sin datos suficientes.',
    `- Evolucion mensual (${currentYear}):`,
    ...annualBreakdownLines,
    buildBudgetSummary(currentMonthExpenses, budgets),
    '- Ultimos gastos:',
    ...recentExpenseLines,
  ].join('\n');
}

function normalizeExpenseDraft(draft) {
  const descripcion = cleanDescription(draft?.descripcion || 'Gasto registrado desde chat') || 'Gasto registrado desde chat';
  const monto = toAmount(draft?.monto);
  const parsedDate = resolveDate(draft?.fecha);

  const normalizedDate = parsedDate
    ? buildLocalDate(parsedDate.getFullYear(), parsedDate.getMonth() + 1, parsedDate.getDate())
    : addDaysToDate(new Date(), 0);

  if (!monto || !normalizedDate) {
    return null;
  }

  return {
    descripcion,
    monto,
    categoria: normalizeCategory(draft?.categoria, descripcion),
    fecha: normalizedDate.toISOString(),
  };
}

async function createExpenseForUser({ userId, draft }) {
  const normalizedDraft = normalizeExpenseDraft(draft);
  if (!normalizedDraft) {
    throw createSupabaseError(null, 'El borrador de gasto no es valido', 400);
  }

  if (isSupabaseConfigured) {
    const payload = {
      descripcion: normalizedDraft.descripcion,
      monto: normalizedDraft.monto,
      categoria: normalizedDraft.categoria,
      fecha: normalizedDraft.fecha,
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
    descripcion: normalizedDraft.descripcion,
    monto: normalizedDraft.monto,
    categoria: normalizedDraft.categoria,
    fecha: normalizedDraft.fecha,
  };

  fallbackChatExpenses.push(created);
  return created;
}

async function createExpensesForUser({ userId, drafts }) {
  const safeDrafts = Array.isArray(drafts)
    ? drafts.map((draft) => normalizeExpenseDraft(draft)).filter(Boolean)
    : [];

  if (safeDrafts.length === 0) {
    return [];
  }

  if (safeDrafts.length === 1) {
    const created = await createExpenseForUser({
      userId,
      draft: safeDrafts[0],
    });
    return created ? [created] : [];
  }

  if (isSupabaseConfigured) {
    const payload = safeDrafts.map((draft) => ({
      descripcion: draft.descripcion,
      monto: draft.monto,
      categoria: draft.categoria,
      fecha: draft.fecha,
      user_id: userId,
    }));

    const { data, error } = await supabase
      .from('gastos')
      .insert(payload)
      .select('*');

    if (error) {
      throw createSupabaseError(error, 'No se pudieron crear los gastos desde el asistente', 400);
    }

    return data || [];
  }

  const createdExpenses = [];
  for (const draft of safeDrafts) {
    const created = await createExpenseForUser({ userId, draft });
    if (created) {
      createdExpenses.push(created);
    }
  }

  return createdExpenses;
}

function normalizeBudgetDraft(draft) {
  const categoria = normalizeCategory(draft?.categoria, '');
  const monto = toAmount(draft?.monto);
  const normalizedPeriod = String(draft?.periodo || 'mensual').toLowerCase().trim();
  const periodo = normalizedPeriod === 'anual' ? 'anual' : 'mensual';

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const rawYear = Number(draft?.anio);
  const anio = Number.isFinite(rawYear) && rawYear >= 2000 && rawYear <= 2100
    ? rawYear
    : currentYear;

  const rawMonth = Number(draft?.mes);
  const mes = periodo === 'mensual'
    ? (Number.isFinite(rawMonth) && rawMonth >= 1 && rawMonth <= 12 ? rawMonth : currentMonth)
    : null;

  if (!categoria || !monto) {
    return null;
  }

  return {
    categoria,
    monto,
    periodo,
    mes,
    anio,
  };
}

async function createBudgetForUser({ userId, draft }) {
  const normalizedDraft = normalizeBudgetDraft(draft);
  if (!normalizedDraft) {
    throw createSupabaseError(null, 'El borrador de presupuesto no es valido', 400);
  }

  if (isSupabaseConfigured) {
    const payload = {
      categoria: normalizedDraft.categoria,
      monto: normalizedDraft.monto,
      periodo: normalizedDraft.periodo,
      mes: normalizedDraft.mes,
      anio: normalizedDraft.anio,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('presupuestos')
      .insert(payload)
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      throw createSupabaseError(error, 'No se pudo crear el presupuesto desde el asistente', 400);
    }

    return data;
  }

  const nextId = fallbackBudgets.reduce((maxId, item) => {
    const itemId = Number(item.id);
    return Number.isFinite(itemId) ? Math.max(maxId, itemId) : maxId;
  }, 0) + 1;

  const created = {
    id: nextId,
    userId: String(userId),
    categoria: normalizedDraft.categoria,
    monto: normalizedDraft.monto,
    periodo: normalizedDraft.periodo,
    mes: normalizedDraft.mes,
    anio: normalizedDraft.anio,
  };

  fallbackBudgets.push(created);
  return created;
}

async function createBudgetsForUser({ userId, drafts }) {
  const safeDrafts = Array.isArray(drafts)
    ? drafts.map((draft) => normalizeBudgetDraft(draft)).filter(Boolean)
    : [];

  if (safeDrafts.length === 0) {
    return [];
  }

  if (safeDrafts.length === 1) {
    const created = await createBudgetForUser({
      userId,
      draft: safeDrafts[0],
    });
    return created ? [created] : [];
  }

  if (isSupabaseConfigured) {
    const payload = safeDrafts.map((draft) => ({
      categoria: draft.categoria,
      monto: draft.monto,
      periodo: draft.periodo,
      mes: draft.mes,
      anio: draft.anio,
      user_id: userId,
    }));

    const { data, error } = await supabase
      .from('presupuestos')
      .insert(payload)
      .select('*');

    if (error) {
      throw createSupabaseError(error, 'No se pudieron crear los presupuestos desde el asistente', 400);
    }

    return data || [];
  }

  const createdBudgets = [];
  for (const draft of safeDrafts) {
    const created = await createBudgetForUser({ userId, draft });
    if (created) {
      createdBudgets.push(created);
    }
  }

  return createdBudgets;
}

function formatBudgetLine(index, draft) {
  const emoji = NUMBER_EMOJIS[index] || `${index + 1}.`;
  const periodLabel = draft.periodo === 'anual'
    ? `anual ${draft.anio}`
    : `mensual mes ${draft.mes} ${draft.anio}`;
  return `${emoji} ${draft.categoria} — ${formatCurrency(draft.monto)} (${periodLabel})`;
}

function buildBudgetsCreatedReply(drafts) {
  if (!Array.isArray(drafts) || drafts.length === 0) {
    return 'No encontre presupuestos validos para guardar.';
  }

  if (drafts.length === 1) {
    return [
      'Presupuesto registrado correctamente.',
      formatBudgetLine(0, drafts[0]),
    ].join('\n');
  }

  const lines = [`Registre ${drafts.length} presupuestos correctamente:`];
  drafts.forEach((draft, index) => {
    lines.push(formatBudgetLine(index, draft));
  });
  return lines.join('\n');
}

function buildMissingBudgetFieldsReply() {
  return [
    'Puedo crear presupuestos, pero me faltaron datos claros.',
    'Formato recomendado:',
    '- Crea presupuesto de Transporte por 1200 mensual',
    '- Crea presupuestos: Alimentacion: 2500, Transporte: 900, Entretenimiento: 400',
  ].join('\n');
}

async function processBudgetActionFlow({ message, user }) {
  const userId = user?.id ? String(user.id) : '';

  if (!isCreateBudgetIntent(message)) {
    return null;
  }

  if (!userId) {
    return buildActionResponse({
      reply: 'Necesito que inicies sesion para crear presupuestos.',
    });
  }

  const budgetDrafts = extractBudgetDrafts(message);
  if (budgetDrafts.length === 0) {
    return buildActionResponse({
      reply: buildMissingBudgetFieldsReply(),
    });
  }

  try {
    const createdBudgets = await createBudgetsForUser({
      userId,
      drafts: budgetDrafts,
    });

    return buildActionResponse({
      reply: buildBudgetsCreatedReply(budgetDrafts),
      actionResult: {
        type: 'create-budget',
        status: 'confirmed',
        presupuestoId: createdBudgets[0]?.id,
      },
    });
  } catch (error) {
    return buildActionResponse({
      reply: `No pude guardar los presupuestos: ${error.message || 'error desconocido'}. Intenta de nuevo con categoria y monto.`,
    });
  }
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
  const dateLabel = formatDateLabel(draft?.fecha);

  const lines = [
    `${username}, detecte una solicitud para registrar un gasto:`,
    `- Descripcion: ${draft.descripcion}`,
    `- Monto: ${formatCurrency(draft.monto)}`,
    `- Categoria: ${draft.categoria}`,
  ];

  if (dateLabel) {
    lines.push(`- Fecha: ${dateLabel}`);
  }

  lines.push(
    '',
    'Por seguridad necesito confirmacion antes de guardar.',
    '- Usa los botones Confirmar o Cancelar.',
    '- Tambien puedes escribir: CONFIRMAR o CANCELAR.',
    `Esta solicitud expira en ${expiresInMinutes} minuto(s).`,
  );

  return lines.join('\n');
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

    const pendingActionBatch = getPendingActionBatch(pendingAction, userId);
    const pendingActionCount = pendingActionBatch.length;
    const pendingDrafts = pendingActionBatch.map((action) => action.draft);

    if (decisionPayload.actionDecision === 'cancel') {
      deletePendingExpenseActions(pendingActionBatch);

      return buildActionResponse({
        reply: pendingActionCount > 1
          ? `Listo, cancele el registro de ${pendingActionCount} gastos pendientes.`
          : 'Listo, cancele el registro del gasto pendiente.',
        actionResult: {
          type: 'create-expense',
          status: 'cancelled',
        },
      });
    }

    try {
      const createdExpenses = await createExpensesForUser({
        userId,
        drafts: pendingDrafts,
      });

      deletePendingExpenseActions(pendingActionBatch);

      if (pendingActionCount > 1) {
        const responseLines = [`Registre ${pendingActionCount} gastos correctamente:`];
        pendingDrafts.forEach((draft, index) => {
          responseLines.push(formatPendingExpenseLine(index, draft));
        });

        return buildActionResponse({
          reply: responseLines.join('\n'),
          actionResult: {
            type: 'create-expense',
            status: 'confirmed',
            gastoId: createdExpenses[0]?.id,
          },
        });
      }

      return buildActionResponse({
        reply: (() => {
          const lines = [
          'Gasto registrado correctamente.',
          `- Descripcion: ${pendingAction.draft.descripcion}`,
          `- Monto: ${formatCurrency(pendingAction.draft.monto)}`,
          `- Categoria: ${pendingAction.draft.categoria}`,
          ];

          const dateLabel = formatDateLabel(pendingAction.draft?.fecha);
          if (dateLabel) {
            lines.push(`- Fecha: ${dateLabel}`);
          }

          return lines.join('\n');
        })(),
        actionResult: {
          type: 'create-expense',
          status: 'confirmed',
          gastoId: createdExpenses[0]?.id,
        },
      });
    } catch (error) {
      const fallbackPendingAction = pendingActionBatch[0] || pendingAction;
      return buildActionResponse({
        reply: `No pude guardar el gasto pendiente: ${error.message || 'error desconocido'}. Puedes volver a intentar confirmar.`,
        pendingAction: buildPendingActionDto(fallbackPendingAction),
      });
    }
  }

  const extractedExpenses = extractMultipleExpenses(message);
  if (extractedExpenses.length > 1) {
    const groupId = randomUUID();
    const pendingActions = extractedExpenses.map((draft, index) => createPendingExpenseAction({
      userId,
      draft,
      replaceExisting: index === 0,
      groupId,
    }));

    return buildActionResponse({
      reply: buildMultiplePendingConfirmationReply(extractedExpenses),
      pendingAction: buildPendingActionDto(pendingActions[0]),
    });
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
    return sanitizeAssistantMarkdown(content.trim());
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return sanitizeAssistantMarkdown(
    content
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }

      return typeof part?.text === 'string' ? part.text : '';
    })
    .join('\n')
    .trim()
  );
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
  const expenseActionResponse = await processExpenseActionFlow({
    message: safeMessage,
    user,
    pendingActionId,
    actionDecision,
  });
  if (expenseActionResponse) {
    return expenseActionResponse;
  }

  const budgetActionResponse = await processBudgetActionFlow({
    message: safeMessage,
    user,
  });
  if (budgetActionResponse) {
    return budgetActionResponse;
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
  extractMultipleExpenses,
  getPendingActionForUser: (userId) => buildPendingActionDto(getLatestPendingExpenseAction(userId)),
  __resetChatActionStateForTests,
};
