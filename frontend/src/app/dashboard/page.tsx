export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <aside className="rounded-xl bg-slate-200 p-4 text-sm text-slate-700">
            <nav className="space-y-3">
              <button type="button" className="w-full rounded-lg bg-slate-300 px-3 py-2 text-left">
                Dashboard
              </button>
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left">
                Nuevo gasto
              </button>
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left">
                Historial
              </button>
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left">
                Configuracion
              </button>
            </nav>
          </aside>

          <section className="rounded-xl border border-slate-200 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-slate-700">Resumen de gastos</h2>
              <button
                type="button"
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Agregar gasto
              </button>
            </div>

            <div className="mt-6 grid place-items-center">
              <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-slate-200">
                <div className="absolute inset-0 rounded-full border border-slate-300" />
                <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-slate-400" />
                <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-slate-400" />
                <div className="text-sm text-slate-600">Grafica</div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Gasto</span>
                <span>$0.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Gasto</span>
                <span>$0.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Gasto</span>
                <span>$0.00</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
