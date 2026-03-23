"use client";

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

type RegisterFieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getSafeRegisterErrorMessage(message: string): string {
  const normalized = String(message || '').trim().toLowerCase();

  if (!normalized) {
    return 'No se pudo crear la cuenta. Intenta nuevamente.';
  }

  if (normalized.includes('ya existe un usuario con ese email')) {
    return 'Ya existe una cuenta con ese correo electrónico.';
  }

  if (normalized.includes('formato de email inválido')) {
    return 'Ingresa un correo electrónico válido.';
  }

  if (normalized.includes('debe tener al menos 6 caracteres')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }

  return 'No se pudo crear la cuenta. Verifica tus datos e intenta nuevamente.';
}

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [formError, setFormError] = useState('');
  const { loading, error, execute } = useApi<AuthResponse>();
  const router = useRouter();

  const validateFields = (
    nameValue: string,
    emailValue: string,
    passwordValue: string,
    confirmPasswordValue: string
  ): RegisterFieldErrors => {
    const nextErrors: RegisterFieldErrors = {};
    const normalizedName = String(nameValue || '').trim();
    const normalizedEmail = String(emailValue || '').trim();

    if (!normalizedName) {
      nextErrors.name = 'El nombre es obligatorio';
    } else if (normalizedName.length < 2) {
      nextErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!normalizedEmail) {
      nextErrors.email = 'El correo electrónico es obligatorio';
    } else if (!isValidEmail(normalizedEmail)) {
      nextErrors.email = 'Ingresa un correo electrónico válido';
    }

    if (!String(passwordValue || '').trim()) {
      nextErrors.password = 'La contraseña es obligatoria';
    } else if (String(passwordValue).length < 6) {
      nextErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!String(confirmPasswordValue || '').trim()) {
      nextErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (passwordValue !== confirmPasswordValue) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    return nextErrors;
  };

  const validateSingleField = (field: keyof RegisterFieldErrors) => {
    const nextErrors = validateFields(name, email, password, confirmPassword);
    setFieldErrors((previous) => ({
      ...previous,
      [field]: nextErrors[field],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors = validateFields(name, email, password, confirmPassword);
    if (
      nextErrors.name ||
      nextErrors.email ||
      nextErrors.password ||
      nextErrors.confirmPassword
    ) {
      setFieldErrors(nextErrors);
      setFormError('Corrige los campos marcados para crear tu cuenta.');
      return;
    }

    setFieldErrors({});
    setFormError('');

    try {
      const response = await execute(() => api.register(name.trim(), email.trim(), password), {
        successMessage: '✓ Cuenta creada exitosamente',
      });
      setBackendSession({ token: response.token, user: response.user });
      router.push('/');
    } catch (err) {
      const apiError = err as ApiError;
      setFormError(getSafeRegisterErrorMessage(apiError.message));
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
      <div className="mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-theme-lg border border-border bg-surface shadow-card md:min-h-[560px] md:flex-row">
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
              <h2 className="font-inter text-xl font-semibold text-text-primary">Crear cuenta</h2>
              <p className="font-inter text-ds-secondary text-text-secondary">Registra tus datos</p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate>
              {loading && (
                <div className="flex justify-center py-4">
                  <Loading size="md" text="Creando cuenta..." />
                </div>
              )}
              <div aria-live="polite" role="status" className="sr-only">
                {loading && 'Creando cuenta...'}
                {!loading && (formError || error?.message || '')}
              </div>
              <Input
                id="name"
                name="name"
                type="text"
                required
                label="Nombre"
                placeholder="Tu nombre"
                autoComplete="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setFieldErrors((previous) => ({ ...previous, name: undefined }));
                  setFormError('');
                }}
                onBlur={() => validateSingleField('name')}
                error={fieldErrors.name}
              />
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
                onBlur={() => validateSingleField('email')}
                error={fieldErrors.email}
              />
              <Input
                id="password"
                name="password"
                type="password"
                required
                label="Contraseña"
                placeholder="********"
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFieldErrors((previous) => ({
                    ...previous,
                    password: undefined,
                    confirmPassword: undefined,
                  }));
                  setFormError('');
                }}
                onBlur={() => validateSingleField('password')}
                error={fieldErrors.password}
              />
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                label="Confirmar contraseña"
                placeholder="********"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setFieldErrors((previous) => ({ ...previous, confirmPassword: undefined }));
                  setFormError('');
                }}
                onBlur={() => validateSingleField('confirmPassword')}
                error={fieldErrors.confirmPassword}
              />

              {(formError || error?.message) && (
                <p role="alert" className="font-inter text-ds-secondary text-error">
                  {formError || error?.message}
                </p>
              )}

              <Button type="submit" disabled={loading} className="w-full rounded-theme-sm">
                {loading ? 'Creando cuenta...' : 'Registrarme'}
              </Button>

              <div className="text-center text-ds-secondary">
                <Link href="/auth/login" className="font-inter text-primary hover:text-primary-hover">
                  ¿Ya tienes cuenta? Inicia sesión
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
