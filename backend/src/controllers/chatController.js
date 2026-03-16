const { generateChatbotReply, getPendingActionForUser } = require('../services/geminiService');
const { appendChatMessagesForUser, getChatHistoryForUser, clearChatHistoryForUser } = require('../services/chatHistoryService');

const MAX_MESSAGE_LENGTH = 1200;
const DEFAULT_HISTORY_LIMIT = 8;
const DEFAULT_HISTORY_PAGE_SIZE = 50;
const ALLOWED_ACTION_DECISIONS = new Set(['confirm', 'cancel']);

function normalizeRequestedHistory(history) {
  return Array.isArray(history) ? history : [];
}

async function getHistory(req, res, next) {
  try {
    const messages = await getChatHistoryForUser(req.user?.id, { limit: DEFAULT_HISTORY_PAGE_SIZE });
    const pendingAction = getPendingActionForUser(req.user?.id);

    return res.json({
      error: false,
      message: 'Historial obtenido correctamente',
      data: {
        messages,
        pendingAction,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function sendMessage(req, res, next) {
  try {
    const message = String(req.body?.message || '').trim();
    const requestedHistory = normalizeRequestedHistory(req.body?.history);
    const pendingActionId = String(req.body?.pendingActionId || '').trim();
    const actionDecisionRaw = String(req.body?.actionDecision || '').toLowerCase().trim();
    const actionDecision = ALLOWED_ACTION_DECISIONS.has(actionDecisionRaw)
      ? actionDecisionRaw
      : '';
    const hasActionDecision = Boolean(actionDecision || pendingActionId);

    if (!message && !hasActionDecision) {
      return res.status(400).json({
        error: true,
        message: 'message es requerido cuando no hay una accion pendiente',
        status: 400,
      });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        error: true,
        message: `message supera el maximo de ${MAX_MESSAGE_LENGTH} caracteres`,
        status: 400,
      });
    }

    const history = requestedHistory.length > 0
      ? requestedHistory
      : await getChatHistoryForUser(req.user?.id, { limit: DEFAULT_HISTORY_LIMIT });

    const payload = {
      message,
      history,
      user: req.user,
    };

    if (pendingActionId) {
      payload.pendingActionId = pendingActionId;
    }

    if (actionDecision) {
      payload.actionDecision = actionDecision;
    }

    const response = await generateChatbotReply(payload);

    await appendChatMessagesForUser(req.user?.id, [
      ...(message ? [{ role: 'user', content: message }] : []),
      {
        role: 'assistant',
        content: response.reply,
        createdAt: response.createdAt,
      },
    ]);

    return res.json({
      error: false,
      message: 'Respuesta generada correctamente',
      data: response,
    });
  } catch (error) {
    return next(error);
  }
}

async function clearHistory(req, res, next) {
  try {
    await clearChatHistoryForUser(req.user?.id);

    return res.json({
      error: false,
      message: 'Historial eliminado correctamente',
      data: null,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getHistory,
  clearHistory,
  sendMessage,
};
