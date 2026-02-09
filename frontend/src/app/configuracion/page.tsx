export default function ConfiguracionPage() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <aside className="rounded-xl bg-slate-200 p-4 text-sm text-slate-700">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Menu
            </div>
            <nav className="space-y-3">
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left">
                Dashboard
              </button>
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left">
                Nuevo gasto
              </button>
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left">
                Historial
              </button>
              <button type="button" className="w-full rounded-lg bg-slate-300 px-3 py-2 text-left">
                Configuracion
              </button>
            </nav>
          </aside>

          <section className="rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-700">Preferencias</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="nombre">
                  Nombre
                </label>
                <input
                  id="nombre"
                  type="text"
                  className="mt-2 w-full rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="correo">
                  Correo
                </label>
                <input
                  id="correo"
                  type="email"
                  className="mt-2 w-full rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="moneda">
                  Moneda
                </label>
                <select
                  id="moneda"
                  className="mt-2 w-full rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
                >
                  <option>MXN</option>
                  <option>USD</option>
                  <option>EUR</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="periodo">
                  Periodo
                </label>
                <select
                  id="periodo"
                  className="mt-2 w-full rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
                >
                  <option>Mensual</option>
                  <option>Quincenal</option>
                  <option>Semanal</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                className="rounded-md bg-slate-300 px-6 py-2 text-sm font-medium text-slate-700"
              >
                Guardar cambios
              </button>
              <button
                type="button"
                className="rounded-md bg-slate-200 px-6 py-2 text-sm font-medium text-slate-700"
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
