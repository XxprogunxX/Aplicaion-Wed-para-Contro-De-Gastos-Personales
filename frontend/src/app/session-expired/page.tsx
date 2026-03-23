'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { clearBackendToken } from '@/lib/session';
import Button from '@/components/ui/Button';

export default function SessionExpiredPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleGoToLogin = () => {
    clearBackendToken();
    router.replace('/auth/login');
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center rounded-theme-lg border border-border bg-surface shadow-card md:min-h-[540px]">
        <div className="flex flex-col items-center gap-6 px-6 py-12 text-center">
          {/* Ícono de sesión expirada */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-warning bg-warning/10">
            <span className="text-4xl text-warning" aria-hidden="true">
              ⏱️
            </span>
          </div>

          {/* Título */}
          <h1 className="font-inter text-3xl font-semibold text-text-primary">
            Tu sesión ha expirado
          </h1>

          {/* Descripción */}
          <p className="font-inter max-w-md text-text-secondary">
            Por seguridad, tu sesión ha sido cerrada automáticamente. Por favor, inicia sesión de nuevo
            para continuar.
          </p>

          {/* Detalles */}
          <div className="rounded-theme-md border border-border bg-background p-4">
            <ul className="space-y-2 text-left text-sm text-text-secondary">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Tu cuenta y datos están seguros</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>No necesitas hacer nada más</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Solo vuelve a iniciar sesión</span>
              </li>
            </ul>
          </div>

          {/* Botón de acción */}
          <div className="flex gap-4">
            <Button
              onClick={handleGoToLogin}
              className="rounded-theme-sm px-8"
            >
              Iniciar sesión nuevamente
            </Button>

            <Link
              href="/"
              className="rounded-theme-sm border border-border px-8 py-2.5 font-inter font-medium text-text-primary transition-all hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Ir al inicio
            </Link>
          </div>

          {/* Contacto de soporte */}
          <p className="font-inter text-xs text-text-secondary">
            ¿Problemas con tu sesión?{' '}
            <a
              href="mailto:soporte@ejemplo.com"
              className="text-primary hover:underline"
            >
              Contacta soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
