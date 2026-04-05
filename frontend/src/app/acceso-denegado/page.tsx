'use client';

import Link from 'next/link';

export default function AccesoDenegadoPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-2xl rounded-theme-lg border border-border bg-surface p-6 shadow-card sm:p-8">
        <h1 className="font-inter text-ds-h2 font-semibold text-text-primary">Acceso denegado</h1>
        <p className="font-inter mt-3 text-ds-secondary text-text-secondary">
          Tu usuario no tiene permisos para entrar a esta sección.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="font-inter rounded-theme-sm bg-primary px-4 py-2 text-ds-secondary font-semibold text-white hover:bg-primary-hover"
          >
            Ir al resumen
          </Link>
          <Link
            href="/auth/login"
            className="font-inter rounded-theme-sm border border-border px-4 py-2 text-ds-secondary text-text-primary hover:bg-background"
          >
            Cambiar de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
