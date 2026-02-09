"use client";

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Completa todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl md:min-h-[560px] md:flex-row">
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
              <h2 className="text-xl font-semibold text-slate-900">Crear cuenta</h2>
              <p className="text-sm text-slate-500">Registra tus datos</p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div
                  className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                  role="alert"
                >
                  {error}
                </div>
              )}
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
                label="Correo electronico"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Input
                id="password"
                name="password"
                type="password"
                required
                label="Contrasena"
                placeholder="********"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                label="Confirmar contrasena"
                placeholder="********"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />

              <Button type="submit" className="w-full rounded-full">
                Registrarme
              </Button>

              <div className="text-center text-sm">
                <Link href="/auth/login" className="text-blue-700 hover:text-blue-600">
                  ¿Ya tienes cuenta? Inicia sesion
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
