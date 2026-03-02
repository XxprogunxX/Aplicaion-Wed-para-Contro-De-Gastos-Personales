"use client";

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSileoToast } from '@/hooks/useSileoToast';
import { DonutChartGastos, DONUT_CHART_GASTOS_MOCK } from '@/components/charts';

export default function HomePage() {
  const router = useRouter();
  const { showSuccess } = useSileoToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || token !== 'token-valido') {
      if (token && token !== 'token-valido') {
        localStorage.removeItem('token');
      }
      router.replace('/auth/login');
    }
  }, [router]);

  const handleAddExpenseClick = useCallback(() => {
    showSuccess('Redirigiendo a nuevo gasto');
  }, [showSuccess]);

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl rounded-theme-lg border border-border bg-surface p-6 shadow-card transition-shadow duration-200 sm:p-8 motion-safe:animate-card-in">
        <section className="rounded-theme-md border border-border bg-surface p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-inter text-ds-h2 font-semibold tracking-tight text-text-primary">
              Resumen de gastos
            </h2>
            <Link
              href="/gastos"
              onClick={handleAddExpenseClick}
              className="inline-flex items-center justify-center rounded-theme-sm bg-primary px-5 py-2.5 text-ds-secondary font-medium text-white shadow-card transition-all duration-200 ease-in-out hover:bg-primary-hover hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.98]"
            >
              Agregar gasto
            </Link>
          </div>

          <div className="mt-8 sm:mt-10">
            <div className="mx-auto max-w-md motion-safe:animate-chart-in">
              <DonutChartGastos data={DONUT_CHART_GASTOS_MOCK} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
