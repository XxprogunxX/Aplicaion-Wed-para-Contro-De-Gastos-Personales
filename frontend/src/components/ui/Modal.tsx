'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function Modal({ isOpen, title, onClose, children }: ModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const titleId = useMemo(
    () => `modal-title-${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  useEffect(() => {
    if (!isOpen) {
      if (previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus();
      }
      return;
    }

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const focusFirst = () => {
      const focusable = containerRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
        return;
      }

      containerRef.current?.focus();
    };

    focusFirst();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={onClose}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
        >
          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl outline-none"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
            initial={
              prefersReducedMotion
                ? false
                : { opacity: 0, y: 8, scale: 0.98 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 8, scale: 0.98 }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.2, ease: 'easeOut' }
            }
          >
            <div className="flex items-center justify-between gap-4">
              <h3 id={titleId} className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-2 py-1 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>
            <div className="mt-4 text-gray-700">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
