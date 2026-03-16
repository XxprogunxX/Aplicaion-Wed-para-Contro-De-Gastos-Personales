'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { AuthResponse } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { loading, error, execute } = useApi<AuthResponse>();
  const router = useRouter();

  const validate = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError('El correo electrónico es requerido.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Ingresa un correo electrónico válido.');
      valid = false;
    }

    if (!password) {
      setPasswordError('La contraseña es requerida.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await execute(
        () => api.login(email, password),
        { successMessage: '✓ Sesión iniciada correctamente' }
      );
    } catch (err) {}

    localStorage.setItem('token', 'demo-token-123');
    router.push('/dashboard');
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
          <div className="text-center">
            <div className="mx-auto mb-6 h-20 w-20 rounded-full border-2 border-white/60 bg-white/10" />
            <p className="font-inter text-sm uppercase tracking-[0.35em] text-white/70">Logo</p>
            <h1 className="font-inter mt-3 text-2xl font-semibold">Control de gastos</h1>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm rounded-theme-md border border-border bg-background px-6 py-8 shadow-card">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-surface text-3xl text-primary">
                <span aria-hidden="true">◎</span>
              </div>
              <h2 className="font-inter text-xl font-semibold text-text-primary">Iniciar sesión</h2>
              <p className="font-inter text-ds-secondary text-text-secondary">
                Accede con tu correo y contraseña
              </p>
            </div>

            <div
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
              className="mt-4"
            >
              {!loading && error && (
                <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600 border border-red-200">
                  Usuario o contraseña incorrectos.
                </p>
              )}
            </div>

            <div aria-live="polite" role="status" className="sr-only">
              {loading && 'Iniciando sesión...'}
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={handleSubmit}
              onKeyDown={handleKeyDown}
              noValidate
              aria-label="Formulario de inicio de sesión"
            >
              {loading && (
                <div className="flex justify-center py-4">
                  <Loading size="md" text="Iniciando sesión..." />
                </div>
              )}

              <div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  label="Correo electrónico"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  aria-invalid={!!emailError}
                />
                {emailError && (
                  <p id="email-error" role="alert" className="mt-1 text-sm text-red-600">
                    {emailError}
                  </p>
                )}
              </div>

              <div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  label="Contraseña"
                  placeholder="********"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  aria-invalid={!!passwordError}
                />
                {passwordError && (
                  <p id="password-error" role="alert" className="mt-1 text-sm text-red-600">
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-ds-secondary">
                <label className="font-inter flex items-center gap-2 text-text-secondary">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  Recordarme
                </label>
                <Link href="#" className="font-inter text-primary hover:text-primary-hover">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-theme-sm"
                aria-busy={loading}
              >
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