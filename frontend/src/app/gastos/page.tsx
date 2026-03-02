'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import type { Gasto } from '@/types';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';

const initialFormState = {
  monto: '',
  categoria: '',
  fecha: '',
  metodoPago: '',
  descripcion: '',
};

export default function GastosPage() {
  const [form, setForm] = useState(initialFormState);
  const { data, loading, error, execute, reset } = useApi<Gasto>();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setForm(initialFormState);
    reset();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const montoValue = Number(form.monto);
    if (!form.descripcion || !form.categoria || !form.monto || Number.isNaN(montoValue)) {
      return;
    }

    try {
      await execute(
        () =>
          api.createGasto({
            descripcion: form.descripcion,
            monto: montoValue,
            categoria: form.categoria,
            fecha: form.fecha,
            metodoPago: form.metodoPago,
          }),
        { successMessage: '✓ Gasto registrado correctamente' }
      );
      setForm(initialFormState);
    } catch {
      // error ya está siendo manejado en el hook
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
      router.back();
      return;
    }

    if (event.key === 'Enter') {
      const target = event.target as HTMLElement;
      const isTextArea = target.tagName === 'TEXTAREA';
      if (isTextArea && !event.shiftKey) {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-6xl rounded-theme-lg border border-border bg-surface p-6 shadow-card">
        <div className="grid gap-6 md:grid-cols-[72px_1fr]">
          <aside
            className="flex flex-col items-center rounded-theme-md border border-border bg-background py-4"
            suppressHydrationWarning
          >
            <button
              type="button"
              className="rounded-theme-sm bg-surface px-2 py-1 text-text-secondary shadow-card"
              aria-label="Abrir menú"
            >
              ☰
            </button>
            <div className="mt-6 h-full w-2 rounded-full bg-border" />
          </aside>

          <section className="rounded-theme-md border border-border p-6">
            <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
              {loading && (
                <div className="flex justify-center py-4">
                  <Loading size="md" text="Guardando gasto..." />
                </div>
              )}
              <div aria-live="polite" role="status" className="sr-only">
                {loading && 'Guardando gasto...'}
                {!loading && error && (error.message || 'Ocurrió un error al guardar el gasto')}
                {!loading && !error && data && 'Gasto registrado correctamente'}
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="font-inter mb-1 block text-ds-secondary font-medium text-text-secondary" htmlFor="amount">
                    Monto
                  </label>
                  <input
                    id="amount"
                    name="monto"
                    type="text"
                    inputMode="decimal"
                    className="font-inter w-full rounded-theme-sm border border-border bg-surface px-3 py-2 text-ds-body text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="$ 0.00"
                    value={form.monto}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="font-inter mb-1 block text-ds-secondary font-medium text-text-secondary" htmlFor="category">
                    Categoría
                  </label>
                  <input
                    id="category"
                    name="categoria"
                    type="text"
                    className="font-inter w-full rounded-theme-sm border border-border bg-surface px-3 py-2 text-ds-body text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: Transporte"
                    value={form.categoria}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="font-inter mb-1 block text-ds-secondary font-medium text-text-secondary" htmlFor="date">
                    Fecha
                  </label>
                  <input
                    id="date"
                    name="fecha"
                    type="text"
                    className="font-inter w-full rounded-theme-sm border border-border bg-surface px-3 py-2 text-ds-body text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="DD/MM/AAAA"
                    value={form.fecha}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="font-inter mb-1 block text-ds-secondary font-medium text-text-secondary" htmlFor="method">
                    Método de pago
                  </label>
                  <select
                    id="method"
                    name="metodoPago"
                    className="font-inter w-full rounded-theme-sm border border-border bg-surface px-3 py-2 text-ds-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.metodoPago}
                    onChange={handleChange}
                  >
                    <option value="">Selecciona</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-inter mb-1 block text-ds-secondary font-medium text-text-secondary" htmlFor="description">
                  Descripción
                </label>
                <textarea
                  id="description"
                  name="descripcion"
                  rows={4}
                  className="font-inter w-full rounded-theme-sm border border-border bg-surface px-3 py-2 text-ds-body text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Descripción del gasto"
                  value={form.descripcion}
                  onChange={handleChange}
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar gasto'}
                </Button>
                <Button type="button" variant="danger" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
