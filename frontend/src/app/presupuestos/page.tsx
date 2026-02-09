export default function PresupuestosPage() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <section className="rounded-xl border border-slate-200 p-6">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
              <div>
                <h2 className="text-base font-semibold text-slate-700">Contenido principal</h2>
                <div className="mt-4 space-y-4 rounded-xl bg-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Columna A</span>
                    <span className="text-xs text-slate-400">Saldo</span>
                  </div>
                  <div className="h-10 rounded-lg bg-slate-200" />
                  <div className="h-10 rounded-lg bg-slate-200" />
                  <button
                    type="button"
                    className="mt-2 w-full rounded-md bg-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    Agregar gasto
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-700">Lista de gastos</h3>
                <div className="mt-4 rounded-xl bg-slate-100 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Columna B</span>
                    <span className="text-xs text-slate-400">Filtros</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="h-8 rounded-md bg-slate-200" />
                    <div className="h-8 rounded-md bg-slate-200" />
                    <div className="h-8 rounded-md bg-slate-200" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-xl bg-slate-200 p-6 text-center text-sm text-slate-600">
              Graficos (gastos por categoria)
            </div>
        </section>
      </div>
    </div>
  );
}
