const { generateChatbotReply } = require('../services/geminiService');

const MAX_MESSAGE_LENGTH = 1200;
const ALLOWED_ACTION_DECISIONS = new Set(['confirm', 'cancel']);

async function sendMessage(req, res, next) {
  try {
    const message = String(req.body?.message || '').trim();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
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

    return res.json({
      error: false,
      message: 'Respuesta generada correctamente',
      data: response,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  sendMessage,
};
