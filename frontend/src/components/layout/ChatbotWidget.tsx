'use client';

import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { emitGastosUpdated, emitPresupuestosUpdated } from '@/lib/utils';
import type { ApiError, ChatHistoryMessage, ChatPendingAction } from '@/types';

type WidgetMessage = ChatHistoryMessage & {
  id: string;
  pending?: boolean;
};

const MAX_HISTORY_MESSAGES = 8;

function buildId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatPendingDate(value?: string): string {
  if (!value) {
    return '';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return parsedDate.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

const INITIAL_MESSAGES: WidgetMessage[] = [
  {
    id: 'assistant-welcome',
    role: 'assistant',
    content:
      'Hola, soy tu asistente IA de gastos. Puedo ayudarte con ahorro, categorias, presupuesto y lectura de reportes.',
  },
];

export default function ChatbotWidget() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>(INITIAL_MESSAGES);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<ChatPendingAction | null>(null);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  function resizeInput(target?: HTMLTextAreaElement | null) {
    const textarea = target || inputRef.current;
    if (!textarea) {
      return;
    }

    const maxHeight = 144;
    textarea.style.height = 'auto';
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${Math.max(nextHeight, 44)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }

  const historyForApi = useMemo<ChatHistoryMessage[]>(() => {
    return messages
      .filter((item) => !item.pending)
      .slice(-MAX_HISTORY_MESSAGES)
      .map((item) => ({
        role: item.role,
        content: item.content,
      }));
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      resizeInput();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!inputValue) {
      resizeInput();
    }
  }, [inputValue]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    endRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'end',
    });
  }, [isOpen, messages, prefersReducedMotion]);

  function applyAssistantResponse(pendingMessageId: string, response: {
    reply: string;
    pendingAction?: ChatPendingAction | null;
    actionResult?: {
      type: 'create-expense' | 'create-budget';
      status: 'confirmed' | 'cancelled';
    } | null;
  }) {
    setMessages((prev) => {
      const withoutPending = prev.filter((item) => item.id !== pendingMessageId);
      return [
        ...withoutPending,
        {
          id: buildId('assistant'),
          role: 'assistant',
          content: response.reply,
        },
      ];
    });

    if (response.pendingAction) {
      setPendingAction(response.pendingAction);
      return;
    }

    if (response.actionResult?.status === 'confirmed') {
      setPendingAction(null);

      if (response.actionResult.type === 'create-budget') {
        emitPresupuestosUpdated();
      } else {
        emitGastosUpdated();
      }

      return;
    }

    if (response.actionResult?.status === 'cancelled') {
      setPendingAction(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanMessage = inputValue.trim();
    if (!cleanMessage || isSending) {
      return;
    }

    setErrorMessage(null);
    setInputValue('');

    const userMessage: WidgetMessage = {
      id: buildId('user'),
      role: 'user',
      content: cleanMessage,
    };

    const pendingMessageId = buildId('assistant-pending');
    const pendingMessage: WidgetMessage = {
      id: pendingMessageId,
      role: 'assistant',
      content: 'Pensando respuesta...',
      pending: true,
    };

    setMessages((prev) => [...prev, userMessage, pendingMessage]);
    setIsSending(true);

    try {
      const response = await api.sendChatMessage(cleanMessage, historyForApi);
      applyAssistantResponse(pendingMessageId, response);
    } catch (error) {
      const apiError = error as ApiError;
      setMessages((prev) => prev.filter((item) => item.id !== pendingMessageId));
      setErrorMessage(apiError.message || 'No fue posible obtener respuesta del asistente');
    } finally {
      setIsSending(false);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(event.target.value);
    resizeInput(event.target);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();
    if (!inputValue.trim() || isSending) {
      return;
    }

    event.currentTarget.form?.requestSubmit();
  }

  async function handlePendingActionDecision(decision: 'confirm' | 'cancel') {
    if (!pendingAction || isSending) {
      return;
    }

    setErrorMessage(null);

    const pendingMessageId = buildId('assistant-pending-decision');
    const pendingMessage: WidgetMessage = {
      id: pendingMessageId,
      role: 'assistant',
      content: decision === 'confirm' ? 'Confirmando registro...' : 'Cancelando registro...',
      pending: true,
    };

    setMessages((prev) => [...prev, pendingMessage]);
    setIsSending(true);

    try {
      const response = await api.sendChatMessage(
        decision === 'confirm' ? 'Confirmar accion pendiente' : 'Cancelar accion pendiente',
        historyForApi,
        {
          pendingActionId: pendingAction.id,
          actionDecision: decision,
        }
      );

      applyAssistantResponse(pendingMessageId, response);
    } catch (error) {
      const apiError = error as ApiError;
      setMessages((prev) => prev.filter((item) => item.id !== pendingMessageId));
      setErrorMessage(apiError.message || 'No fue posible procesar la accion pendiente');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3" aria-label="Asistente IA">
      {isOpen ? (
        <div
          id="chatbot-panel"
          className={`w-[min(92vw,24rem)] overflow-hidden rounded-theme-lg border border-border bg-surface shadow-xl ${
            prefersReducedMotion ? '' : 'motion-safe:animate-modal-pop-in'
          }`}
        >
          <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
            <div>
              <p className="font-inter text-ds-secondary font-semibold text-text-primary">Asistente IA</p>
              <p className="font-inter text-xs text-text-secondary">Asistente IA para finanzas personales</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-theme-sm px-2 py-1 text-ds-secondary text-text-secondary transition-colors hover:bg-surface hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Cerrar asistente"
            >
              Cerrar
            </button>
          </header>

          <div className="max-h-[22rem] min-h-[18rem] space-y-3 overflow-y-auto bg-surface px-3 py-4" role="log" aria-live="polite">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <article
                  key={message.id}
                  className={`max-w-[90%] rounded-theme-md px-3 py-2 text-sm leading-relaxed shadow-card ${
                    isUser
                      ? 'ml-auto bg-primary text-white'
                      : 'mr-auto border border-border bg-background text-text-primary'
                  } ${message.pending ? 'italic opacity-90' : ''} whitespace-pre-wrap break-words`}
                >
                  {message.content}
                </article>
              );
            })}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border bg-background px-3 py-3">
            {errorMessage ? (
              <p role="alert" className="mb-2 rounded-theme-sm border border-error/20 bg-error/10 px-2 py-1 text-xs text-error">
                {errorMessage}
              </p>
            ) : null}

            {pendingAction ? (
              <div className="mb-2 rounded-theme-sm border border-primary/30 bg-primary/5 px-2 py-2 text-xs text-text-primary">
                <p className="font-semibold">Accion pendiente: registrar gasto</p>
                <p>
                  {pendingAction.descripcion} - ${pendingAction.monto.toFixed(2)} ({pendingAction.categoria})
                </p>
                {formatPendingDate(pendingAction.fecha) ? (
                  <p>Fecha detectada: {formatPendingDate(pendingAction.fecha)}</p>
                ) : null}
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded-theme-sm bg-primary px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                    onClick={() => handlePendingActionDecision('confirm')}
                    disabled={isSending}
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    className="rounded-theme-sm border border-border px-2 py-1 text-xs font-medium text-text-primary transition-colors hover:bg-surface disabled:opacity-60"
                    onClick={() => handlePendingActionDecision('cancel')}
                    disabled={isSending}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <label htmlFor="chatbot-input" className="sr-only">
                Escribe un mensaje para el asistente
              </label>
              <textarea
                ref={inputRef}
                id="chatbot-input"
                rows={1}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder="Escribe tu mensaje..."
                className="font-inter min-h-[2.75rem] w-full resize-none rounded-theme-sm border border-border bg-surface px-3 py-2 text-[15px] leading-6 text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={isSending}
                maxLength={1200}
                spellCheck={false}
                autoCorrect="off"
                autoComplete="off"
              />
              <button
                type="submit"
                className="rounded-theme-sm bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!inputValue.trim() || isSending}
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-text-primary shadow-xl transition-all hover:-translate-y-0.5 hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-controls="chatbot-panel"
      >
        {isOpen ? 'Ocultar IA' : 'Abrir IA'}
      </button>
    </section>
  );
}
