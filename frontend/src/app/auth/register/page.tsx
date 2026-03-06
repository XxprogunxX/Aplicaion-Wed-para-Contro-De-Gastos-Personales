"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import type { ApiError, AuthResponse } from '@/types';
import { setBackendToken } from '@/lib/session';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [liveMessage, setLiveMessage] = useState('');
  const { loading, error, execute } = useApi<AuthResponse>();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setLiveMessage('Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      setLiveMessage('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await execute(() => api.register(name, email, password), {
        successMessage: '✓ Cuenta creada exitosamente',
      });
      setBackendToken(response.token);
      setLiveMessage('Cuenta creada exitosamente');
      router.push('/');
    } catch (err) {
      const apiError = err as ApiError;
      setLiveMessage(apiError.message || 'Ocurrió un error al crear la cuenta');
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
                {!loading && error && (error.message || 'Ocurrió un error al crear la cuenta')}
                {!loading && !error && liveMessage}
              </div>
              <Input
                id="name"
                name="name"
                type="text"
                required
                label="Nombre"
                placeholder="Tu nombre"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Input
                id="email"
                name="email"
                type="email"
                required
                label="Correo electrónico"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Input
                id="password"
                name="password"
                type="password"
                required
                label="Contraseña"
                placeholder="********"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                label="Confirmar contraseña"
                placeholder="********"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />

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
