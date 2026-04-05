'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { hasPermission } from '@/lib/accessControl';
import { ensureBackendToken } from '@/lib/session';
import { getBackendUserRole } from '@/lib/session';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import {
  CATEGORIAS_UPDATED_EVENT,
  formatCurrency,
  getCurrentMonth,
  getCurrentYear,
  PRESUPUESTOS_UPDATED_EVENT,
} from '@/lib/utils';
import type { ApiError, Categoria, Presupuesto } from '@/types';

interface PresupuestoForm {
  categoria: string;
  monto: string;
  periodo: 'mensual' | 'anual';
  mes: string;
  anio: string;
}

interface CategoriaForm {
  nombre: string;
  color: string;
  icono: string;
}

const initialForm: PresupuestoForm = {
  categoria: '',
  monto: '',
  periodo: 'mensual',
  mes: String(getCurrentMonth()),
  anio: String(getCurrentYear()),
};

const initialCategoriaForm: CategoriaForm = {
  nombre: '',
  color: '#64748b',
  icono: 'tag',
};

function normalizeColorHex(value?: string): string {
  const raw = String(value || '').trim();
  return /^#([\da-f]{3}|[\da-f]{6})$/i.test(raw) ? raw : '#64748b';
}

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
  const [categoriaForm, setCategoriaForm] = useState<CategoriaForm>(initialCategoriaForm);
  const [categoriaEditForm, setCategoriaEditForm] = useState<CategoriaForm>(initialCategoriaForm);
  const [estado, setEstado] = useState<Presupuesto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [editingCategoriaId, setEditingCategoriaId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCategoria, setSavingCategoria] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const userRole = getBackendUserRole();
  const canManageCategories = hasPermission(userRole, 'categories:manage');

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleDataUpdated = () => {
      void cargarEstado();
    };

    window.addEventListener(PRESUPUESTOS_UPDATED_EVENT, handleDataUpdated);
    window.addEventListener(CATEGORIAS_UPDATED_EVENT, handleDataUpdated);

    return () => {
      window.removeEventListener(PRESUPUESTOS_UPDATED_EVENT, handleDataUpdated);
      window.removeEventListener(CATEGORIAS_UPDATED_EVENT, handleDataUpdated);
    };
  }, [cargarEstado]);

  const categoriasDisponibles = useMemo(() => {
    const fromApi = categorias.map((item) => item.nombre);
    const fromEstado = estado.map((item) => item.categoria);
    return Array.from(new Set([...fromApi, ...fromEstado])).filter(Boolean);
  }, [categorias, estado]);

  const categoriasOrdenadas = useMemo(() => {
    return [...categorias].sort((a, b) => {
      const aGlobal = Boolean(a.esGlobal);
      const bGlobal = Boolean(b.esGlobal);

      if (aGlobal !== bGlobal) {
        return aGlobal ? 1 : -1;
      }

      return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es', {
        sensitivity: 'base',
      });
    });
  }, [categorias]);

  useEffect(() => {
    if (!form.categoria && categoriasDisponibles.length > 0) {
      setForm((prev) => ({ ...prev, categoria: categoriasDisponibles[0] || '' }));
    }
  }, [categoriasDisponibles, form.categoria]);

  const handleFormChange = (field: keyof PresupuestoForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoriaFormChange = (field: keyof CategoriaForm, value: string) => {
    setCategoriaForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoriaEditFormChange = (field: keyof CategoriaForm, value: string) => {
    setCategoriaEditForm((prev) => ({ ...prev, [field]: value }));
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
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message || 'No se pudo guardar el presupuesto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePresupuesto = useCallback(async (id: string | number) => {
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

  const handleCreateCategoria = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManageCategories) {
      setErrorMessage('No tienes permisos para crear categorías.');
      return;
    }

    const nombre = categoriaForm.nombre.trim();
    if (!nombre) {
      setErrorMessage('El nombre de la categoría es obligatorio.');
      return;
    }

    setSavingCategoria(true);
    setErrorMessage(null);

    try {
      await api.createCategoria({
        nombre,
        color: normalizeColorHex(categoriaForm.color),
        icono: categoriaForm.icono.trim() || 'tag',
      });

      setCategoriaForm(initialCategoriaForm);
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message || 'No se pudo crear la categoría.');
    } finally {
      setSavingCategoria(false);
    }
  };

  const startEditCategoria = (categoria: Categoria) => {
    if (!canManageCategories) {
      setErrorMessage('No tienes permisos para editar categorías.');
      return;
    }

    if (categoria.esGlobal) {
      return;
    }

    setEditingCategoriaId(categoria.id);
    setCategoriaEditForm({
      nombre: categoria.nombre || '',
      color: normalizeColorHex(categoria.color),
      icono: categoria.icono || 'tag',
    });
  };

  const cancelEditCategoria = () => {
    setEditingCategoriaId(null);
    setCategoriaEditForm(initialCategoriaForm);
  };

  const saveEditCategoria = async (id: string | number) => {
    if (!canManageCategories) {
      setErrorMessage('No tienes permisos para actualizar categorías.');
      return;
    }

    const nombre = categoriaEditForm.nombre.trim();
    if (!nombre) {
      setErrorMessage('El nombre de la categoría es obligatorio.');
      return;
    }

    setSavingCategoria(true);
    setErrorMessage(null);

    try {
      await api.updateCategoria(id, {
        nombre,
        color: normalizeColorHex(categoriaEditForm.color),
        icono: categoriaEditForm.icono.trim() || 'tag',
      });

      cancelEditCategoria();
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message || 'No se pudo actualizar la categoría.');
    } finally {
      setSavingCategoria(false);
    }
  };

  const handleDeleteCategoria = useCallback(async (categoria: Categoria) => {
    if (!canManageCategories) {
      setErrorMessage('No tienes permisos para eliminar categorías.');
      return;
    }

    if (categoria.esGlobal) {
      setErrorMessage('Las categorías globales no se pueden eliminar.');
      return;
    }

    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(`¿Seguro que deseas eliminar la categoría "${categoria.nombre}"?`);
      if (!confirmed) {
        return;
      }
    }

    setSavingCategoria(true);
    setErrorMessage(null);

    try {
      await api.deleteCategoria(categoria.id);

      if (String(editingCategoriaId) === String(categoria.id)) {
        cancelEditCategoria();
      }
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message || 'No se pudo eliminar la categoría.');
    } finally {
      setSavingCategoria(false);
    }
  }, [canManageCategories, editingCategoriaId]);

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
            <div className="space-y-4">
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

              <section className="rounded-theme-md border border-border bg-background p-4">
                <h2 className="font-inter text-ds-body font-semibold text-text-primary">Gestionar categorías</h2>

                {!canManageCategories ? (
                  <div className="mt-4 rounded-theme-sm border border-warning/30 bg-warning/10 p-3">
                    <p className="font-inter text-ds-secondary text-text-secondary">
                      Tu rol no tiene permisos para crear, editar o eliminar categorías.
                    </p>
                  </div>
                ) : null}

                {canManageCategories ? (
                <form onSubmit={handleCreateCategoria} className="mt-4 space-y-3">
                  <div>
                    <label className="font-inter mb-1 block text-ds-secondary text-text-secondary" htmlFor="categoria-nombre">
                      Nombre
                    </label>
                    <input
                      id="categoria-nombre"
                      type="text"
                      value={categoriaForm.nombre}
                      onChange={(event) => handleCategoriaFormChange('nombre', event.target.value)}
                      className="font-inter w-full rounded-theme-sm border border-border bg-surface px-3 py-2 text-ds-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Ej: Hogar"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[72px_1fr]">
                    <div>
                      <label className="font-inter mb-1 block text-ds-secondary text-text-secondary" htmlFor="categoria-color">
                        Color
                      </label>
                      <input
                        id="categoria-color"
                        type="color"
                        value={normalizeColorHex(categoriaForm.color)}
                        onChange={(event) => handleCategoriaFormChange('color', event.target.value)}
                        className="h-10 w-full rounded-theme-sm border border-border bg-surface p-1"
                      />
                    </div>

                    <div>
                      <label className="font-inter mb-1 block text-ds-secondary text-text-secondary" htmlFor="categoria-icono">
                        Ícono
                      </label>
                      <input
                        id="categoria-icono"
                        type="text"
                        value={categoriaForm.icono}
                        onChange={(event) => handleCategoriaFormChange('icono', event.target.value)}
                        className="font-inter w-full rounded-theme-sm border border-border bg-surface px-3 py-2 text-ds-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="tag"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={savingCategoria || loading} className="w-full">
                    {savingCategoria ? 'Guardando...' : 'Agregar categoría'}
                  </Button>
                </form>
                ) : null}

                <div className="mt-4 space-y-3">
                  {categoriasOrdenadas.length === 0 ? (
                    <p className="font-inter text-ds-secondary text-text-secondary">No hay categorías disponibles.</p>
                  ) : (
                    categoriasOrdenadas.map((categoria) => {
                      const isGlobal = Boolean(categoria.esGlobal);
                      const isEditing = String(editingCategoriaId) === String(categoria.id);

                      return (
                        <article key={String(categoria.id)} className="rounded-theme-sm border border-border bg-surface p-3">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={categoriaEditForm.nombre}
                                onChange={(event) => handleCategoriaEditFormChange('nombre', event.target.value)}
                                className="font-inter w-full rounded-theme-sm border border-border bg-background px-2 py-1.5 text-ds-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                              <div className="grid gap-2 sm:grid-cols-[64px_1fr]">
                                <input
                                  type="color"
                                  value={normalizeColorHex(categoriaEditForm.color)}
                                  onChange={(event) => handleCategoriaEditFormChange('color', event.target.value)}
                                  className="h-9 w-full rounded-theme-sm border border-border bg-background p-1"
                                />
                                <input
                                  type="text"
                                  value={categoriaEditForm.icono}
                                  onChange={(event) => handleCategoriaEditFormChange('icono', event.target.value)}
                                  className="font-inter w-full rounded-theme-sm border border-border bg-background px-2 py-1.5 text-ds-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="tag"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={savingCategoria}
                                  onClick={() => void saveEditCategoria(categoria.id)}
                                  className="font-inter rounded-theme-sm bg-primary px-2.5 py-1 text-[12px] text-white hover:bg-primary-hover disabled:opacity-60"
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  disabled={savingCategoria}
                                  onClick={cancelEditCategoria}
                                  className="font-inter rounded-theme-sm border border-border px-2.5 py-1 text-[12px] text-text-primary hover:bg-background disabled:opacity-60"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-inter flex items-center gap-2 text-ds-secondary font-semibold text-text-primary">
                                  <span
                                    className="inline-block h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: normalizeColorHex(categoria.color) }}
                                  />
                                  <span className="truncate">{categoria.nombre}</span>
                                </p>
                                <p className="font-inter mt-0.5 text-[12px] text-text-secondary">
                                  {isGlobal ? 'Global' : 'Personal'} · icono: {categoria.icono || 'tag'}
                                </p>
                              </div>

                              {!isGlobal && canManageCategories ? (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => startEditCategoria(categoria)}
                                    className="font-inter rounded-theme-sm border border-border px-2 py-1 text-[12px] text-text-primary hover:bg-background"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={savingCategoria}
                                    onClick={() => void handleDeleteCategoria(categoria)}
                                    className="font-inter rounded-theme-sm bg-error px-2 py-1 text-[12px] text-white hover:bg-error-hover disabled:opacity-60"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              ) : (
                                <span className="font-inter rounded-theme-sm border border-border px-2 py-1 text-[12px] text-text-secondary">
                                  {isGlobal ? 'Protegida' : 'Solo lectura'}
                                </span>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            </div>

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
                            onClick={() => void handleDeletePresupuesto(item.id)}
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
