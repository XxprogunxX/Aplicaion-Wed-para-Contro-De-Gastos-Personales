export default function PerfilPage() {
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
                Gastos
              </button>
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left">
                Historial
              </button>
              <button type="button" className="w-full rounded-lg bg-slate-300 px-3 py-2 text-left">
                Perfil
              </button>
            </nav>
          </aside>

          <section className="rounded-xl border border-slate-200 p-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-200 text-3xl text-slate-500">
                👤
              </div>
              <div className="w-full">
                <h2 className="text-base font-semibold text-slate-700">Informacion personal</h2>
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
                    <label className="text-sm font-medium text-slate-700" htmlFor="telefono">
                      Telefono
                    </label>
                    <input
                      id="telefono"
                      type="text"
                      className="mt-2 w-full rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
                      placeholder="(55) 1234-5678"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700" htmlFor="zona">
                      Zona
                    </label>
                    <input
                      id="zona"
                      type="text"
                      className="mt-2 w-full rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
                      placeholder="Ciudad"
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-4">
                  <button
                    type="button"
                    className="rounded-md bg-slate-300 px-6 py-2 text-sm font-medium text-slate-700"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-slate-200 px-6 py-2 text-sm font-medium text-slate-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
