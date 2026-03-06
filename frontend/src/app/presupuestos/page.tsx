'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { ensureBackendToken } from '@/lib/session';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import { formatCurrency, getCurrentMonth, getCurrentYear } from '@/lib/utils';
import type { ApiError, Categoria, Presupuesto } from '@/types';

interface PresupuestoForm {
  categoria: string;
  monto: string;
  periodo: 'mensual' | 'anual';
  mes: string;
  anio: string;
}

const initialForm: PresupuestoForm = {
  categoria: '',
  monto: '',
  periodo: 'mensual',
  mes: String(getCurrentMonth()),
  anio: String(getCurrentYear()),
};

function getProgressValue(item: Presupuesto): number {
  if (typeof item.porcentajeUsado === 'number') {
    return item.porcentajeUsado;
  }

  const monto = Number(item.monto || 0);
  const gastado = Number(item.gastado || 0);
  if (!monto) {
    return 0;
  }

  return Number(((gastado / monto) * 100).toFixed(2));
}

function getDisponible(item: Presupuesto): number {
  if (typeof item.disponible === 'number') {
    return item.disponible;
  }

  return Number(item.monto || 0) - Number(item.gastado || 0);
}

export default function PresupuestosPage() {
  const [form, setForm] = useState<PresupuestoForm>(initialForm);
  const [estado, setEstado] = useState<Presupuesto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cargarEstado = useCallback(async () => {
    ensureBackendToken();

    setLoading(true);
    setErrorMessage(null);

    try {
      const [estadoData, categoriasData] = await Promise.all([
        api.getPresupuestosEstado(),
        api.getCategorias().catch(() => [] as Categoria[]),
      ]);

      setEstado(estadoData);
      setCategorias(categoriasData);
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message || 'No se pudo cargar la información de presupuestos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarEstado();
  }, [cargarEstado]);

  const categoriasDisponibles = useMemo(() => {
    const fromApi = categorias.map((item) => item.nombre);
    const fromEstado = estado.map((item) => item.categoria);
    return Array.from(new Set([...fromApi, ...fromEstado])).filter(Boolean);
  }, [categorias, estado]);

  useEffect(() => {
    if (!form.categoria && categoriasDisponibles.length > 0) {
      setForm((prev) => ({ ...prev, categoria: categoriasDisponibles[0] || '' }));
    }
  }, [categoriasDisponibles, form.categoria]);

  const handleFormChange = (field: keyof PresupuestoForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const monto = Number(form.monto);
    const anio = Number(form.anio);
    const mes = Number(form.mes);

    if (!form.categoria || !Number.isFinite(monto) || monto <= 0 || !Number.isFinite(anio) || anio < 2000) {
      setErrorMessage('Completa una categoría, un monto válido y un año correcto.');
      return;
    }

    if (form.periodo === 'mensual' && (!Number.isFinite(mes) || mes < 1 || mes > 12)) {
      setErrorMessage('Selecciona un mes válido para el presupuesto mensual.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      await api.createPresupuesto({
        categoria: form.categoria,
        monto,
        periodo: form.periodo,
        mes: form.periodo === 'mensual' ? mes : null,
        anio,
      });

      setForm((prev) => ({
        ...prev,
        monto: '',
      }));

      await cargarEstado();
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message || 'No se pudo guardar el presupuesto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = useCallback(async (id: string | number) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('¿Seguro que deseas eliminar este presupuesto?');
      if (!confirmed) {
        return;
      }
    }

    try {
      await api.deletePresupuesto(id);
      setEstado((prev) => prev.filter((item) => String(item.id) !== String(id)));
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message || 'No se pudo eliminar el presupuesto.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl rounded-theme-lg border border-border bg-surface p-6 shadow-card sm:p-8">
        <section className="rounded-theme-md border border-border bg-surface p-6">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-inter text-ds-h2 font-semibold text-text-primary">Presupuestos</h1>
              <p className="font-inter mt-1 text-ds-secondary text-text-secondary">
                Administra tus límites por categoría y periodo.
              </p>
            </div>

            <Button type="button" variant="secondary" onClick={() => void cargarEstado()}>
              Actualizar
            </Button>
          </header>

          {errorMessage ? (
            <div className="mb-4 rounded-theme-md border border-error/30 bg-error/10 p-4">
              <p className="font-inter text-ds-secondary text-error">{errorMessage}</p>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <form onSubmit={handleCreate} className="rounded-theme-md border border-border bg-background p-4">
              <h2 className="font-inter text-ds-body font-semibold text-text-primary">Nuevo presupuesto</h2>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="font-inter mb-1 block text-ds-secondary text-text-secondary" htmlFor="categoria">
                    Categoría
                  </label>
                  <select
                    id="categoria"
                    value={form.categoria}
                    onChange={(event) => handleFormChange('categoria', event.target.value)}
                    className="font-inter w-full rounded-theme-sm border border-border bg-surface px-3 py-2 text-ds-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {categoriasDisponibles.length === 0 ? <option value="">Sin categorías</option> : null}
                    {categoriasDisponibles.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-inter mb-1 block text-ds-secondary text-text-secondary" htmlFor="monto">
                    Monto
                  </label>
                  <input
                    id="monto"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.monto}
                    onChange={(event) => handleFormChange('monto', event.target.value)}
                    className="font-inter w-full rounded-theme-sm border border-border bg-surface px-3 py-2 text-ds-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="font-inter mb-1 block text-ds-secondary text-text-secondary" htmlFor="periodo">
                    Periodo
                  </label>
                  <select
                    id="periodo"
                    value={form.periodo}
                    onChange={(event) => handleFormChange('periodo', event.target.value as PresupuestoForm['periodo'])}
                    className="font-inter w-full rounded-theme-sm border border-border bg-surface px-3 py-2 text-ds-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="mensual">Mensual</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>

                {form.periodo === 'mensual' ? (
                  <div>
                    <label className="font-inter mb-1 block text-ds-secondary text-text-secondary" htmlFor="mes">
                      Mes
                    </label>
                    <input
                      id="mes"
                      type="number"
                      min="1"
                      max="12"
                      value={form.mes}
                      onChange={(event) => handleFormChange('mes', event.target.value)}
                      className="font-inter w-full rounded-theme-sm border border-border bg-surface px-3 py-2 text-ds-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ) : null}

                <div>
                  <label className="font-inter mb-1 block text-ds-secondary text-text-secondary" htmlFor="anio">
                    Año
                  </label>
                  <input
                    id="anio"
                    type="number"
                    min="2000"
                    value={form.anio}
                    onChange={(event) => handleFormChange('anio', event.target.value)}
                    className="font-inter w-full rounded-theme-sm border border-border bg-surface px-3 py-2 text-ds-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <Button type="submit" disabled={saving || loading} className="w-full">
                  {saving ? 'Guardando...' : 'Crear presupuesto'}
                </Button>
              </div>
            </form>

            <div className="rounded-theme-md border border-border bg-background p-4">
              <h2 className="font-inter text-ds-body font-semibold text-text-primary">Estado actual</h2>

              {loading ? (
                <div className="mt-6 flex justify-center">
                  <Loading text="Cargando presupuestos..." />
                </div>
              ) : null}

              {!loading && estado.length === 0 ? (
                <p className="font-inter mt-4 text-ds-secondary text-text-secondary">
                  Aún no tienes presupuestos registrados.
                </p>
              ) : null}

              {!loading && estado.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {estado.map((item) => {
                    const porcentaje = getProgressValue(item);
                    const progressWidth = Math.max(0, Math.min(100, porcentaje));
                    const disponible = getDisponible(item);

                    return (
                      <article key={String(item.id)} className="rounded-theme-md border border-border bg-surface p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-inter text-ds-body font-semibold text-text-primary">{item.categoria}</h3>
                          <button
                            type="button"
                            onClick={() => void handleDelete(item.id)}
                            className="font-inter rounded-theme-sm bg-error px-2.5 py-1 text-[12px] text-white hover:bg-error-hover"
                          >
                            Eliminar
                          </button>
                        </div>

                        <p className="font-inter mt-2 text-ds-secondary text-text-secondary">
                          Presupuesto: <span className="font-semibold text-text-primary">{formatCurrency(Number(item.monto || 0))}</span>
                        </p>
                        <p className="font-inter text-ds-secondary text-text-secondary">
                          Gastado: <span className="font-semibold text-text-primary">{formatCurrency(Number(item.gastado || 0))}</span>
                        </p>
                        <p className="font-inter text-ds-secondary text-text-secondary">
                          Disponible:{' '}
                          <span className={`font-semibold ${disponible < 0 ? 'text-error' : 'text-success'}`}>
                            {formatCurrency(disponible)}
                          </span>
                        </p>

                        <div className="mt-3 h-2 w-full rounded-full bg-border">
                          <div
                            className={`h-2 rounded-full ${porcentaje > 100 ? 'bg-error' : 'bg-primary'}`}
                            style={{ width: `${progressWidth}%` }}
                          />
                        </div>
                        <p className="font-inter mt-1 text-[12px] text-text-secondary">
                          {porcentaje.toFixed(2)}% utilizado · {item.periodo}
                          {item.periodo === 'mensual' && item.mes ? ` · mes ${item.mes}` : ''} · {item.anio}
                        </p>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
