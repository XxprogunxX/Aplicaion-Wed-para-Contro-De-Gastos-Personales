'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { ensureBackendToken } from '@/lib/session';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import { formatCurrency, getCurrentMonth, getCurrentYear, getMonthName } from '@/lib/utils';
import type {
  ApiError,
  ReporteAnual,
  ReporteComparativo,
  ReporteMensual,
  ReportePorCategoria,
} from '@/types';

const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);

export default function ReportesPage() {
  const [mes, setMes] = useState<number>(getCurrentMonth());
  const [anio, setAnio] = useState<number>(getCurrentYear());

  const [reporteMensual, setReporteMensual] = useState<ReporteMensual | null>(null);
  const [reporteAnual, setReporteAnual] = useState<ReporteAnual | null>(null);
  const [reporteCategorias, setReporteCategorias] = useState<ReportePorCategoria | null>(null);
  const [reporteComparativo, setReporteComparativo] = useState<ReporteComparativo | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cargarReportes = useCallback(async (mesSeleccionado: number, anioSeleccionado: number) => {
    ensureBackendToken();

    setLoading(true);
    setErrorMessage(null);

    const periodoActual = new Date(anioSeleccionado, mesSeleccionado - 1, 1);
    const periodoComparado = new Date(anioSeleccionado, mesSeleccionado - 2, 1);

    try {
      const [mensual, anual, porCategoria, comparativo] = await Promise.all([
        api.getReporteMensual(mesSeleccionado, anioSeleccionado),
        api.getReporteAnual(anioSeleccionado),
        api.getReportePorCategoria(),
        api.getReporteComparativo({
          mesActual: periodoActual.getMonth() + 1,
          anioActual: periodoActual.getFullYear(),
          mesComparar: periodoComparado.getMonth() + 1,
          anioComparar: periodoComparado.getFullYear(),
        }),
      ]);

      setReporteMensual(mensual);
      setReporteAnual(anual);
      setReporteCategorias(porCategoria);
      setReporteComparativo(comparativo);
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message || 'No se pudieron cargar los reportes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarReportes(mes, anio);
  }, [anio, cargarReportes, mes]);

  const variacionPorcentual = reporteComparativo?.variacionPorcentual ?? 0;
  const variacionPositiva = (reporteComparativo?.variacion || 0) >= 0;

  const gastosPorMes = useMemo(() => {
    if (!reporteAnual?.gastosPorMes) {
      return [];
    }

    return Object.entries(reporteAnual.gastosPorMes)
      .map(([mesKey, total]) => ({
        mes: Number(mesKey),
        total: Number(total) || 0,
      }))
      .sort((a, b) => a.mes - b.mes);
  }, [reporteAnual]);

  const maxMesTotal = useMemo(() => {
    if (gastosPorMes.length === 0) {
      return 0;
    }
    return Math.max(...gastosPorMes.map((item) => item.total));
  }, [gastosPorMes]);

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl rounded-theme-lg border border-border bg-surface p-6 shadow-card sm:p-8">
        <section className="rounded-theme-md border border-border bg-surface p-6">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-inter text-ds-h2 font-semibold text-text-primary">Reportes</h1>
              <p className="font-inter mt-1 text-ds-secondary text-text-secondary">
                Análisis mensual, anual y por categoría.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={mes}
                onChange={(event) => setMes(Number(event.target.value))}
                className="font-inter rounded-theme-sm border border-border bg-background px-3 py-2 text-ds-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Selecciona mes"
              >
                {monthOptions.map((item) => (
                  <option key={item} value={item}>
                    {getMonthName(item)}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={2000}
                value={anio}
                onChange={(event) => setAnio(Number(event.target.value))}
                className="font-inter w-28 rounded-theme-sm border border-border bg-background px-3 py-2 text-ds-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Selecciona año"
              />

              <Button type="button" variant="secondary" onClick={() => void cargarReportes(mes, anio)}>
                Actualizar
              </Button>
            </div>
          </header>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loading text="Cargando reportes..." />
            </div>
          ) : null}

          {!loading && errorMessage ? (
            <div className="rounded-theme-md border border-error/30 bg-error/10 p-4">
              <p className="font-inter text-ds-secondary text-error">{errorMessage}</p>
            </div>
          ) : null}

          {!loading && !errorMessage ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <article className="rounded-theme-md border border-border bg-background p-4">
                  <p className="font-inter text-ds-secondary text-text-secondary">Total mensual</p>
                  <p className="font-inter mt-1 text-ds-h3 font-semibold text-text-primary">
                    {formatCurrency(reporteMensual?.totalGastado || 0)}
                  </p>
                </article>
                <article className="rounded-theme-md border border-border bg-background p-4">
                  <p className="font-inter text-ds-secondary text-text-secondary">Total anual</p>
                  <p className="font-inter mt-1 text-ds-h3 font-semibold text-text-primary">
                    {formatCurrency(reporteAnual?.totalGastado || 0)}
                  </p>
                </article>
                <article className="rounded-theme-md border border-border bg-background p-4">
                  <p className="font-inter text-ds-secondary text-text-secondary">Variación vs periodo anterior</p>
                  <p className={`font-inter mt-1 text-ds-h3 font-semibold ${variacionPositiva ? 'text-error' : 'text-success'}`}>
                    {variacionPositiva ? '+' : ''}
                    {formatCurrency(reporteComparativo?.variacion || 0)}
                  </p>
                  <p className="font-inter text-[12px] text-text-secondary">
                    {Number.isFinite(variacionPorcentual)
                      ? `${variacionPorcentual.toFixed(2)}%`
                      : 'Sin base de comparación'}
                  </p>
                </article>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <section className="rounded-theme-md border border-border bg-background p-4">
                  <h2 className="font-inter text-ds-body font-semibold text-text-primary">Gasto por categoría</h2>

                  {!reporteCategorias || reporteCategorias.categorias.length === 0 ? (
                    <p className="font-inter mt-4 text-ds-secondary text-text-secondary">No hay datos por categoría.</p>
                  ) : (
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full divide-y divide-border">
                        <thead>
                          <tr>
                            <th className="font-inter px-3 py-2 text-left text-ds-secondary text-text-secondary">Categoría</th>
                            <th className="font-inter px-3 py-2 text-right text-ds-secondary text-text-secondary">Total</th>
                            <th className="font-inter px-3 py-2 text-right text-ds-secondary text-text-secondary">% del total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {reporteCategorias.categorias.map((item) => (
                            <tr key={item.categoria}>
                              <td className="font-inter px-3 py-2 text-ds-body text-text-primary">{item.categoria}</td>
                              <td className="font-inter px-3 py-2 text-right text-ds-body text-text-primary">
                                {formatCurrency(item.total)}
                              </td>
                              <td className="font-inter px-3 py-2 text-right text-ds-body text-text-secondary">
                                {item.porcentaje.toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="rounded-theme-md border border-border bg-background p-4">
                  <h2 className="font-inter text-ds-body font-semibold text-text-primary">Evolución anual</h2>

                  {gastosPorMes.length === 0 ? (
                    <p className="font-inter mt-4 text-ds-secondary text-text-secondary">No hay datos anuales.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {gastosPorMes.map((item) => {
                        const width = maxMesTotal ? Math.max(4, (item.total / maxMesTotal) * 100) : 0;
                        return (
                          <div key={item.mes}>
                            <div className="mb-1 flex items-center justify-between">
                              <span className="font-inter text-ds-secondary text-text-secondary">{getMonthName(item.mes)}</span>
                              <span className="font-inter text-ds-secondary text-text-primary">{formatCurrency(item.total)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-border">
                              <div className="h-2 rounded-full bg-primary" style={{ width: `${width}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
