'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import type { Gasto } from '@/types';

const initialFormState = {
  monto: '',
  categoria: '',
  fecha: '',
  metodoPago: '',
  descripcion: '',
};

export default function GastosPage() {
  const [form, setForm] = useState(initialFormState);
  const [successMessage, setSuccessMessage] = useState('');
  const { loading, error, execute, reset } = useApi<Gasto>();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setForm(initialFormState);
    setSuccessMessage('');
    reset();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccessMessage('');

    const montoValue = Number(form.monto);
    if (!form.descripcion || !form.categoria || !form.monto || Number.isNaN(montoValue)) {
      return;
    }

    try {
      await execute(() =>
        api.createGasto({
          descripcion: form.descripcion,
          monto: montoValue,
          categoria: form.categoria,
          fecha: form.fecha,
          metodoPago: form.metodoPago,
        })
      );
      setSuccessMessage('Exito');
      setForm(initialFormState);
    } catch {
      // error ya esta en el hook
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
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-[72px_1fr]">
          <aside className="flex flex-col items-center rounded-xl bg-slate-200 py-4">
            <button
              type="button"
              className="rounded-md bg-white px-2 py-1 text-slate-600 shadow"
              aria-label="Abrir menu"
            >
              ☰
            </button>
            <div className="mt-6 h-full w-2 rounded-full bg-slate-300" />
          </aside>

          <section className="rounded-xl border border-slate-200 p-6">
            <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
              {error && (
                <div
                  className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                  role="alert"
                >
                  Error
                </div>
              )}
              {successMessage && (
                <div
                  className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800"
                  role="status"
                >
                  {successMessage}
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="amount">
                    Monto
                  </label>
                  <input
                    id="amount"
                    name="monto"
                    type="text"
                    inputMode="decimal"
                    className="mt-2 w-full rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
                    placeholder="$ 0.00"
                    value={form.monto}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="category">
                    Categoria
                  </label>
                  <input
                    id="category"
                    name="categoria"
                    type="text"
                    className="mt-2 w-full rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
                    placeholder="Ej: Transporte"
                    value={form.categoria}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="date">
                    Fecha
                  </label>
                  <input
                    id="date"
                    name="fecha"
                    type="text"
                    className="mt-2 w-full rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
                    placeholder="DD/MM/AAAA"
                    value={form.fecha}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="method">
                    Metodo de pago
                  </label>
                  <select
                    id="method"
                    name="metodoPago"
                    className="mt-2 w-full rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
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
                <label className="text-sm font-medium text-slate-700" htmlFor="description">
                  Descripcion
                </label>
                <textarea
                  id="description"
                  name="descripcion"
                  rows={4}
                  className="mt-2 w-full rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
                  placeholder="Descripcion del gasto"
                  value={form.descripcion}
                  onChange={handleChange}
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-green-500 px-6 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? 'Guardando...' : 'Guardar gasto'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-md bg-red-500 px-6 py-2 text-sm font-medium text-white"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
