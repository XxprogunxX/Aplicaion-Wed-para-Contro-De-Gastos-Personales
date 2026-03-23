'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import type { ApiError, ForgotPasswordResponse } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getSafeForgotPasswordErrorMessage(message: string): string {
  const normalized = String(message || '').trim().toLowerCase();

  if (!normalized) {
    return 'No se pudo procesar la solicitud. Intenta nuevamente.';
  }

  if (normalized.includes('email es requerido')) {
    return 'El correo electrónico es obligatorio.';
  }

  if (normalized.includes('formato de email inválido')) {
    return 'Ingresa un correo electrónico válido.';
  }

  return 'No se pudo procesar la solicitud. Intenta nuevamente.';
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { loading, error, execute } = useApi<ForgotPasswordResponse>();
  const router = useRouter();

  const validateEmail = (value: string): string => {
    const normalized = String(value || '').trim();

    if (!normalized) {
      return 'El correo electrónico es obligatorio';
    }

    if (!isValidEmail(normalized)) {
      return 'Ingresa un correo electrónico válido';
    }

    return '';
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextError = validateEmail(email);
    if (nextError) {
      setEmailError(nextError);
      setFormError('Corrige el correo electrónico para continuar.');
      setSuccessMessage('');
      return;
    }

    setEmailError('');
    setFormError('');

    try {
      await execute(() => api.forgotPassword(email.trim()), {
        successMessage: 'Si el correo existe, te enviamos instrucciones de recuperación.',
      });
      setSuccessMessage('Si el correo existe, te enviamos instrucciones de recuperación.');
    } catch (err) {
      const apiError = err as ApiError;
      setFormError(getSafeForgotPasswordErrorMessage(apiError.message));
      setSuccessMessage('');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-theme-lg border border-border bg-surface shadow-card md:min-h-[540px] md:flex-row">
        <div className="flex min-h-[220px] flex-1 items-center justify-center bg-primary px-10 py-12 text-white">
          <div className="w-full max-w-md rounded-theme-md bg-white/95 p-4 text-center shadow-card">
            <Image
              src="/images/logo.png"
              alt="Gastos Personales"
              width={677}
              height={369}
              priority
              className="mx-auto h-auto w-full max-w-[300px] sm:max-w-[360px]"
            />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm rounded-theme-md border border-border bg-background px-6 py-8 shadow-card">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-surface text-3xl text-primary">
                <span aria-hidden="true">◎</span>
              </div>
              <h2 className="font-inter text-xl font-semibold text-text-primary">Recuperar contraseña</h2>
              <p className="font-inter text-ds-secondary text-text-secondary">
                Ingresa tu correo y te enviaremos instrucciones
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate>
              {loading && (
                <div className="flex justify-center py-4">
                  <Loading size="md" text="Procesando solicitud..." />
                </div>
              )}
              <div aria-live="polite" role="status" className="sr-only">
                {loading && 'Procesando solicitud...'}
                {!loading && (successMessage || formError || error?.message || '')}
              </div>

              <Input
                id="recovery-email"
                name="email"
                type="email"
                required
                label="Correo electrónico"
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailError('');
                  setFormError('');
                  setSuccessMessage('');
                }}
                onBlur={handleEmailBlur}
                error={emailError}
              />

              {(formError || error?.message) && (
                <p role="alert" className="font-inter text-ds-secondary text-error">
                  {formError || error?.message}
                </p>
              )}

              {successMessage && (
                <p role="status" className="font-inter text-ds-secondary text-success">
                  {successMessage}
                </p>
              )}

              <Button type="submit" disabled={loading} className="w-full rounded-theme-sm">
                {loading ? 'Enviando...' : 'Enviar instrucciones'}
              </Button>

              <div className="text-center text-ds-secondary">
                <Link href="/auth/login" className="font-inter text-primary hover:text-primary-hover">
                  Volver a iniciar sesión
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
