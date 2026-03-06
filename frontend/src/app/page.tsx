"use client";

import { useEffect, useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSileoToast } from '@/hooks/useSileoToast';
import { DonutChartGastos, type DonutChartGastosDato } from '@/components/charts';
import Loading from '@/components/ui/Loading';
import { api } from '@/lib/api';
import { ensureBackendToken } from '@/lib/session';
import { formatCurrency, getCurrentMonth, getCurrentYear, getMonthName } from '@/lib/utils';
import type { ApiError, ReporteMensual } from '@/types';

export default function HomePage() {
  const { showSuccess } = useSileoToast();
  const [reporte, setReporte] = useState<ReporteMensual | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mesActual = getCurrentMonth();
  const anioActual = getCurrentYear();

  const cargarResumen = useCallback(async () => {
    ensureBackendToken();

    setLoading(true);
    setErrorMessage(null);

    try {
      const data = await api.getReporteMensual(mesActual, anioActual);
      setReporte(data);
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message || 'No se pudo cargar el resumen de gastos.');
    } finally {
      setLoading(false);
    }
  }, [anioActual, mesActual]);

  useEffect(() => {
    void cargarResumen();
  }, [cargarResumen]);

  const handleAddExpenseClick = useCallback(() => {
    showSuccess('Redirigiendo a nuevo gasto');
  }, [showSuccess]);

  const dataChart = useMemo<DonutChartGastosDato[]>(() => {
    if (!reporte?.gastosPorCategoria) {
      return [];
    }

    return Object.entries(reporte.gastosPorCategoria)
      .map(([name, value]) => ({
        name,
        value: Number(value) || 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [reporte]);

  const totalGastado = reporte?.totalGastado || 0;
  const cantidadGastos = reporte?.cantidadGastos ?? reporte?.gastos.length ?? 0;
  const categoriaTop = dataChart[0]?.name || 'Sin datos';

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl rounded-theme-lg border border-border bg-surface p-6 shadow-card transition-shadow duration-200 sm:p-8 motion-safe:animate-card-in">
        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-theme-md border border-border bg-background p-4">
            <p className="font-inter text-ds-secondary text-text-secondary">Total del mes</p>
            <p className="font-inter mt-1 text-ds-h3 font-semibold text-text-primary">{formatCurrency(totalGastado)}</p>
          </article>
          <article className="rounded-theme-md border border-border bg-background p-4">
            <p className="font-inter text-ds-secondary text-text-secondary">Cantidad de gastos</p>
            <p className="font-inter mt-1 text-ds-h3 font-semibold text-text-primary">{cantidadGastos}</p>
          </article>
          <article className="rounded-theme-md border border-border bg-background p-4">
            <p className="font-inter text-ds-secondary text-text-secondary">Categoría principal</p>
            <p className="font-inter mt-1 text-ds-h3 font-semibold text-text-primary">{categoriaTop}</p>
          </article>
        </section>

        <section className="rounded-theme-md border border-border bg-surface p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-inter text-ds-h2 font-semibold tracking-tight text-text-primary">
              Resumen de {getMonthName(mesActual)} {anioActual}
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
            {loading ? (
              <div className="flex min-h-[280px] items-center justify-center">
                <Loading text="Cargando resumen..." />
              </div>
            ) : null}

            {!loading && errorMessage ? (
              <div className="rounded-theme-md border border-error/30 bg-error/10 p-4">
                <p className="font-inter text-ds-secondary text-error">{errorMessage}</p>
                <button
                  type="button"
                  onClick={() => void cargarResumen()}
                  className="font-inter mt-3 rounded-theme-sm bg-error px-3 py-1.5 text-ds-secondary text-white hover:bg-error-hover"
                >
                  Reintentar
                </button>
              </div>
            ) : null}

            {!loading && !errorMessage ? (
              <div className="mx-auto max-w-md motion-safe:animate-chart-in">
                <DonutChartGastos data={dataChart} />
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
