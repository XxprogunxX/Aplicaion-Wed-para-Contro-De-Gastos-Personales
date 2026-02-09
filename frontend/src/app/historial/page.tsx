export default function HistorialPage() {
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
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center gap-2 rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700">
                <span className="text-slate-600">▦</span>
                Fecha
                <span className="ml-2 text-slate-500">▾</span>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-slate-200 p-6">
              <div className="space-y-4">
                <div className="h-2 w-full rounded-full bg-slate-400" />
                <div className="h-2 w-full rounded-full bg-slate-400" />
                <div className="h-2 w-full rounded-full bg-slate-400" />
                <div className="h-2 w-full rounded-full bg-slate-400" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
