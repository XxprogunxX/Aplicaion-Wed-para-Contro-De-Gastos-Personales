'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';

type ResetFieldErrors = {
  password?: string;
  confirmPassword?: string;
};

const MIN_PASSWORD_LENGTH = 6;

function getSafeResetErrorMessage(message: string): string {
  const normalized = String(message || '').trim().toLowerCase();

  if (!normalized) {
    return 'No se pudo restablecer la contraseña. Intenta nuevamente.';
  }

  if (
    normalized.includes('expired') ||
    normalized.includes('invalid') ||
    normalized.includes('token') ||
    normalized.includes('otp')
  ) {
    return 'El enlace de recuperación es inválido o expiró. Solicita uno nuevo.';
  }

  if (normalized.includes('at least') || normalized.includes('min')) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  if (normalized.includes('different')) {
    return 'La nueva contraseña debe ser diferente a la anterior.';
  }

  return 'No se pudo restablecer la contraseña. Intenta nuevamente.';
}

function clearSensitiveUrlParts() {
  if (typeof window === 'undefined') {
    return;
  }

  const cleanUrl = `${window.location.origin}/auth/reset-password`;
  window.history.replaceState({}, document.title, cleanUrl);
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ResetFieldErrors>({});
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const router = useRouter();

  const validateFields = (
    passwordValue: string,
    confirmPasswordValue: string
  ): ResetFieldErrors => {
    const nextErrors: ResetFieldErrors = {};

    if (!String(passwordValue || '').trim()) {
      nextErrors.password = 'La nueva contraseña es obligatoria';
    } else if (String(passwordValue).length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
    }

    if (!String(confirmPasswordValue || '').trim()) {
      nextErrors.confirmPassword = 'Confirma tu nueva contraseña';
    } else if (passwordValue !== confirmPasswordValue) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    return nextErrors;
  };

  useEffect(() => {
    let isCancelled = false;

    const initializeRecovery = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const queryParams = new URLSearchParams(window.location.search);

        const accessToken = String(hashParams.get('access_token') || '').trim();
        const refreshToken = String(hashParams.get('refresh_token') || '').trim();
        const hashType = String(hashParams.get('type') || '').trim().toLowerCase();

        if (accessToken && refreshToken && (!hashType || hashType === 'recovery')) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            if (!isCancelled) {
              setFormError(getSafeResetErrorMessage(error.message));
            }
          } else if (!isCancelled) {
            setRecoveryReady(true);
            clearSensitiveUrlParts();
          }

          return;
        }

        const code = String(queryParams.get('code') || '').trim();
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            if (!isCancelled) {
              setFormError(getSafeResetErrorMessage(error.message));
            }
          } else if (!isCancelled) {
            setRecoveryReady(true);
            clearSensitiveUrlParts();
          }

          return;
        }

        const tokenHash = String(queryParams.get('token_hash') || '').trim();
        const queryType = String(queryParams.get('type') || '').trim().toLowerCase();

        if (tokenHash && queryType === 'recovery') {
          const email = String(queryParams.get('email') || '').trim();
          const verifyPayload = email
            ? { type: 'recovery' as const, token_hash: tokenHash, email }
            : { type: 'recovery' as const, token_hash: tokenHash };

          const { error } = await supabase.auth.verifyOtp(verifyPayload);

          if (error) {
            if (!isCancelled) {
              setFormError(getSafeResetErrorMessage(error.message));
            }
          } else if (!isCancelled) {
            setRecoveryReady(true);
            clearSensitiveUrlParts();
          }

          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isCancelled) {
          if (session) {
            setRecoveryReady(true);
          } else {
            setFormError('El enlace de recuperación es inválido o expiró. Solicita uno nuevo.');
          }
        }
      } catch {
        if (!isCancelled) {
          setFormError('No se pudo validar el enlace de recuperación. Solicita uno nuevo.');
        }
      } finally {
        if (!isCancelled) {
          setInitializing(false);
        }
      }
    };

    void initializeRecovery();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handlePasswordBlur = () => {
    const nextErrors = validateFields(password, confirmPassword);
    setFieldErrors((previous) => ({
      ...previous,
      password: nextErrors.password,
    }));
  };

  const handleConfirmPasswordBlur = () => {
    const nextErrors = validateFields(password, confirmPassword);
    setFieldErrors((previous) => ({
      ...previous,
      confirmPassword: nextErrors.confirmPassword,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!recoveryReady) {
      setFormError('El enlace de recuperación es inválido o expiró. Solicita uno nuevo.');
      return;
    }

    const nextErrors = validateFields(password, confirmPassword);
    if (nextErrors.password || nextErrors.confirmPassword) {
      setFieldErrors(nextErrors);
      setFormError('Corrige los campos marcados para continuar.');
      return;
    }

    setFieldErrors({});
    setFormError('');
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setFormError(getSafeResetErrorMessage(error.message));
        return;
      }

      setSuccessMessage('Contraseña actualizada correctamente. Ahora puedes iniciar sesión.');
      await supabase.auth.signOut();
      setTimeout(() => {
        router.push('/auth/login');
      }, 1400);
    } catch {
      setFormError('No se pudo restablecer la contraseña. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      router.push('/auth/forgot-password');
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
              <h2 className="font-inter text-xl font-semibold text-text-primary">Restablecer contraseña</h2>
              <p className="font-inter text-ds-secondary text-text-secondary">
                Ingresa y confirma tu nueva contraseña
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate>
              {(initializing || submitting) && (
                <div className="flex justify-center py-4">
                  <Loading
                    size="md"
                    text={initializing ? 'Validando enlace de recuperación...' : 'Actualizando contraseña...'}
                  />
                </div>
              )}

              <div aria-live="polite" role="status" className="sr-only">
                {initializing && 'Validando enlace de recuperación...'}
                {submitting && 'Actualizando contraseña...'}
                {!initializing && (successMessage || formError || '')}
              </div>

              {successMessage && (
                <p role="status" className="font-inter text-ds-secondary text-success">
                  {successMessage}
                </p>
              )}

              {!successMessage && (
                <>
                  <Input
                    id="new-password"
                    name="password"
                    type="password"
                    required
                    label="Nueva contraseña"
                    placeholder="********"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setFieldErrors((previous) => ({ ...previous, password: undefined }));
                      setFormError('');
                    }}
                    onBlur={handlePasswordBlur}
                    error={fieldErrors.password}
                    disabled={initializing || submitting || !recoveryReady}
                  />

                  <Input
                    id="confirm-new-password"
                    name="confirmPassword"
                    type="password"
                    required
                    label="Confirmar nueva contraseña"
                    placeholder="********"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setFieldErrors((previous) => ({ ...previous, confirmPassword: undefined }));
                      setFormError('');
                    }}
                    onBlur={handleConfirmPasswordBlur}
                    error={fieldErrors.confirmPassword}
                    disabled={initializing || submitting || !recoveryReady}
                  />
                </>
              )}

              {formError && (
                <p role="alert" className="font-inter text-ds-secondary text-error">
                  {formError}
                </p>
              )}

              {!successMessage && (
                <Button
                  type="submit"
                  disabled={initializing || submitting || !recoveryReady}
                  className="w-full rounded-theme-sm"
                >
                  {submitting ? 'Guardando nueva contraseña...' : 'Guardar nueva contraseña'}
                </Button>
              )}

              <div className="text-center text-ds-secondary">
                <Link href="/auth/forgot-password" className="font-inter text-primary hover:text-primary-hover">
                  Solicitar un nuevo enlace
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
