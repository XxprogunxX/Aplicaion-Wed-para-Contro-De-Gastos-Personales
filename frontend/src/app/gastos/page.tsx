export default function GastosPage() {
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
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="amount">
                  Monto
                </label>
                <input
                  id="amount"
                  type="text"
                  className="mt-2 w-full rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
                  placeholder="$ 0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="category">
                  Categoria
                </label>
                <input
                  id="category"
                  type="text"
                  className="mt-2 w-full rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
                  placeholder="Ej: Transporte"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="date">
                  Fecha
                </label>
                <input
                  id="date"
                  type="text"
                  className="mt-2 w-full rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
                  placeholder="DD/MM/AAAA"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="method">
                  Metodo de pago
                </label>
                <select
                  id="method"
                  className="mt-2 w-full rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
                >
                  <option>Selecciona</option>
                  <option>Efectivo</option>
                  <option>Tarjeta</option>
                  <option>Transferencia</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-slate-700" htmlFor="description">
                Descripcion
              </label>
              <textarea
                id="description"
                rows={4}
                className="mt-2 w-full rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
                placeholder="Descripcion del gasto"
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                className="rounded-md bg-green-500 px-6 py-2 text-sm font-medium text-white"
              >
                Guardar gasto
              </button>
              <button
                type="button"
                className="rounded-md bg-red-500 px-6 py-2 text-sm font-medium text-white"
              >
                Cancelar
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
