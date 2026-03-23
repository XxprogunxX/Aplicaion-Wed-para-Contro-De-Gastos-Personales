'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import type { ApiError, AuthResponse } from '@/types';
import { setBackendSession } from '@/lib/session';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';

type LoginFieldErrors = {
  email?: string;
  password?: string;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getSafeLoginErrorMessage(message: string): string {
  const normalized = String(message || '').trim().toLowerCase();

  if (!normalized) {
    return 'No se pudo iniciar sesión. Intenta nuevamente.';
  }

  if (normalized.includes('credenciales inválidas')) {
    return 'Credenciales inválidas. Verifica correo y contraseña.';
  }

  if (normalized.includes('email y password son requeridos')) {
    return 'Completa correo y contraseña.';
  }

  return 'No se pudo iniciar sesión. Verifica tus datos e intenta nuevamente.';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState('');
  const { loading, error, execute } = useApi<AuthResponse>();
  const router = useRouter();

  const validateFields = (emailValue: string, passwordValue: string): LoginFieldErrors => {
    const nextErrors: LoginFieldErrors = {};
    const normalizedEmail = String(emailValue || '').trim();

    if (!normalizedEmail) {
      nextErrors.email = 'El correo electrónico es obligatorio';
    } else if (!isValidEmail(normalizedEmail)) {
      nextErrors.email = 'Ingresa un correo electrónico válido';
    }

    if (!String(passwordValue || '').trim()) {
      nextErrors.password = 'La contraseña es obligatoria';
    }

    return nextErrors;
  };

  const handleEmailBlur = () => {
    const nextErrors = validateFields(email, password);
    setFieldErrors((previous) => ({
      ...previous,
      email: nextErrors.email,
    }));
  };

  const handlePasswordBlur = () => {
    const nextErrors = validateFields(email, password);
    setFieldErrors((previous) => ({
      ...previous,
      password: nextErrors.password,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateFields(email, password);
    if (nextErrors.email || nextErrors.password) {
      setFieldErrors(nextErrors);
      setFormError('Corrige los campos marcados para iniciar sesión.');
      return;
    }

    setFieldErrors({});
    setFormError('');

    try {
      const response = await execute(() => api.login(email.trim(), password), {
        successMessage: '✓ Sesión iniciada correctamente',
      });
      setBackendSession({ token: response.token, user: response.user });
      router.push('/');
    } catch (err) {
      const apiError = err as ApiError;
      setFormError(getSafeLoginErrorMessage(apiError.message));
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
              <h2 className="font-inter text-xl font-semibold text-text-primary">Iniciar sesión</h2>
              <p className="font-inter text-ds-secondary text-text-secondary">Accede con tu correo y contraseña</p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate>
              {loading && (
                <div className="flex justify-center py-4">
                  <Loading size="md" text="Iniciando sesión..." />
                </div>
              )}
              <div aria-live="polite" role="status" className="sr-only">
                {loading && 'Iniciando sesión...'}
                {!loading && (formError || error?.message || '')}
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                required
                label="Correo electrónico"
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldErrors((previous) => ({ ...previous, email: undefined }));
                  setFormError('');
                }}
                onBlur={handleEmailBlur}
                error={fieldErrors.email}
              />
              <Input
                id="password"
                name="password"
                type="password"
                required
                label="Contraseña"
                placeholder="********"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFieldErrors((previous) => ({ ...previous, password: undefined }));
                  setFormError('');
                }}
                onBlur={handlePasswordBlur}
                error={fieldErrors.password}
              />

              {(formError || error?.message) && (
                <p role="alert" className="font-inter text-ds-secondary text-error">
                  {formError || error?.message}
                </p>
              )}

              <div className="flex items-center justify-between text-ds-secondary">
                <label className="font-inter flex items-center gap-2 text-text-secondary">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  Recordarme
                </label>
                <Link href="/auth/forgot-password" className="font-inter text-primary hover:text-primary-hover">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button type="submit" disabled={loading} className="w-full rounded-theme-sm">
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Button>

              <div className="text-center text-ds-secondary">
                <Link href="/auth/register" className="font-inter text-primary hover:text-primary-hover">
                  ¿No tienes cuenta? Regístrate
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
