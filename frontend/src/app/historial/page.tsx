'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { ensureBackendToken } from '@/lib/session';
import Loading from '@/components/ui/Loading';
import Button from '@/components/ui/Button';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import type { ApiError, Gasto } from '@/types';

function getSortableTimestamp(gasto: Gasto): number {
  const fecha = gasto.fecha || gasto.createdAt || gasto.created_at;
  if (!fecha) {
    return 0;
  }

  const parsed = new Date(fecha).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getDisplayDate(gasto: Gasto): string {
  const fecha = gasto.fecha || gasto.createdAt || gasto.created_at;
  if (!fecha) {
    return 'Sin fecha';
  }

  return formatDateShort(fecha);
}

export default function HistorialPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');

  const cargarGastos = useCallback(async () => {
    ensureBackendToken();

    setLoading(true);
    setErrorMessage(null);

    try {
      const data = await api.getGastos();
      setGastos(data);
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message || 'No se pudo cargar el historial de gastos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarGastos();
  }, [cargarGastos]);

  const categorias = useMemo(() => {
    const items = Array.from(new Set(gastos.map((gasto) => gasto.categoria).filter(Boolean)));
    return ['todas', ...items];
  }, [gastos]);

  const gastosFiltrados = useMemo(() => {
    const base = [...gastos].sort((a, b) => getSortableTimestamp(b) - getSortableTimestamp(a));

    if (categoriaFiltro === 'todas') {
      return base;
    }

    return base.filter((gasto) => gasto.categoria === categoriaFiltro);
  }, [categoriaFiltro, gastos]);

  const totalFiltrado = useMemo(
    () => gastosFiltrados.reduce((acc, item) => acc + Number(item.monto || 0), 0),
    [gastosFiltrados]
  );

  const handleDelete = useCallback(async (id: string | number) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('¿Seguro que deseas eliminar este gasto?');
      if (!confirmed) {
        return;
      }
    }

    try {
      await api.deleteGasto(id);
      setGastos((prev) => prev.filter((item) => String(item.id) !== String(id)));
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message || 'No se pudo eliminar el gasto.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl rounded-theme-lg border border-border bg-surface p-6 shadow-card sm:p-8">
        <section className="rounded-theme-md border border-border bg-surface p-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-inter text-ds-h2 font-semibold text-text-primary">Historial de gastos</h1>
              <p className="font-inter mt-1 text-ds-secondary text-text-secondary">
                {gastosFiltrados.length} registro(s) · Total {formatCurrency(totalFiltrado)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoriaFiltro}
                onChange={(event) => setCategoriaFiltro(event.target.value)}
                className="font-inter rounded-theme-sm border border-border bg-background px-3 py-2 text-ds-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Filtrar por categoría"
              >
                {categorias.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria === 'todas' ? 'Todas las categorías' : categoria}
                  </option>
                ))}
              </select>
              <Button type="button" variant="secondary" onClick={() => void cargarGastos()}>
                Actualizar
              </Button>
            </div>
          </header>

          <div className="mt-6">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loading text="Cargando historial..." />
              </div>
            ) : null}

            {!loading && errorMessage ? (
              <div className="rounded-theme-md border border-error/30 bg-error/10 p-4">
                <p className="font-inter text-ds-secondary text-error">{errorMessage}</p>
              </div>
            ) : null}

            {!loading && !errorMessage && gastosFiltrados.length === 0 ? (
              <div className="rounded-theme-md border border-border bg-background p-6 text-center">
                <p className="font-inter text-ds-secondary text-text-secondary">No hay gastos para mostrar.</p>
              </div>
            ) : null}

            {!loading && !errorMessage && gastosFiltrados.length > 0 ? (
              <div className="overflow-x-auto rounded-theme-md border border-border">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-background">
                    <tr>
                      <th className="font-inter px-4 py-3 text-left text-ds-secondary font-semibold text-text-secondary">Descripción</th>
                      <th className="font-inter px-4 py-3 text-left text-ds-secondary font-semibold text-text-secondary">Categoría</th>
                      <th className="font-inter px-4 py-3 text-left text-ds-secondary font-semibold text-text-secondary">Fecha</th>
                      <th className="font-inter px-4 py-3 text-right text-ds-secondary font-semibold text-text-secondary">Monto</th>
                      <th className="font-inter px-4 py-3 text-right text-ds-secondary font-semibold text-text-secondary">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-surface">
                    {gastosFiltrados.map((gasto) => (
                      <tr key={String(gasto.id)}>
                        <td className="font-inter px-4 py-3 text-ds-body text-text-primary">{gasto.descripcion}</td>
                        <td className="font-inter px-4 py-3 text-ds-body text-text-secondary">{gasto.categoria}</td>
                        <td className="font-inter px-4 py-3 text-ds-body text-text-secondary">{getDisplayDate(gasto)}</td>
                        <td className="font-inter px-4 py-3 text-right text-ds-body font-semibold text-text-primary">
                          {formatCurrency(Number(gasto.monto || 0))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => void handleDelete(gasto.id)}
                            className="font-inter rounded-theme-sm bg-error px-3 py-1.5 text-ds-secondary text-white hover:bg-error-hover"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
