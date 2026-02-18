'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { AuthResponse } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, execute } = useApi<AuthResponse>();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Rehabilitar autenticacion real cuando este el backend listo.
    // try {
    //   const response = await execute(() => api.login(email, password), { successMessage: '✓ Sesión iniciada correctamente' });
    //   localStorage.setItem('token', response.token);
    //   router.push('/');
    // } catch (err) {
    //   // Error ya está manejado en el hook
    // }

    localStorage.setItem('token', 'token-valido');
    router.push('/');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl md:min-h-[540px] md:flex-row">
        <div className="flex min-h-[220px] flex-1 items-center justify-center bg-teal-600 px-10 py-12 text-white">
          <div className="text-center">
            <div className="mx-auto mb-6 h-20 w-20 rounded-full border-2 border-white/60 bg-white/10" />
            <p className="text-sm uppercase tracking-[0.35em] text-white/70">Logo</p>
            <h1 className="mt-3 text-2xl font-semibold">Control de gastos</h1>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm rounded-2xl border border-blue-200 bg-slate-50 px-6 py-8 shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-blue-500 bg-white text-3xl text-blue-600">
                <span aria-hidden="true">◎</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Iniciar sesion</h2>
              <p className="text-sm text-slate-500">Accede con tu correo y contrasena</p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate>
              <Input
                id="email"
                name="email"
                type="email"
                required
                label="Correo electronico"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                id="password"
                name="password"
                type="password"
                required
                label="Contrasena"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  Recordarme
                </label>
                <Link href="#" className="text-teal-700 hover:text-teal-600">
                  ¿Olvidaste tu contrasena?
                </Link>
              </div>

              <Button type="submit" disabled={loading} className="w-full rounded-full">
                {loading ? 'Iniciando sesion...' : 'Login'}
              </Button>

              <div className="text-center text-sm">
                <Link href="/auth/register" className="text-blue-700 hover:text-blue-600">
                  ¿No tienes cuenta? Registrate
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
