"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sileo } from 'sileo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [liveMessage, setLiveMessage] = useState('');
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      sileo.warning({ title: 'Por favor completa todos los campos' });
      setLiveMessage('Por favor completa todos los campos');
      return;
    }
    if (password !== confirmPassword) {
      sileo.error({ title: 'Las contraseñas no coinciden' });
      setLiveMessage('Las contraseñas no coinciden');
      return;
    }
    sileo.success({ title: '✓ Cuenta creada exitosamente' });
    setLiveMessage('Cuenta creada exitosamente');
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
              <h2 className="font-inter text-xl font-semibold text-text-primary">Crear cuenta</h2>
              <p className="font-inter text-ds-secondary text-text-secondary">Registra tus datos</p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
              <div aria-live="polite" role="status" className="sr-only">
                {liveMessage}
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

              <Button type="submit" className="w-full rounded-theme-sm">
                Registrarme
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
