"use client";

import { useEffect, useState } from "react";

type Gasto = {
  id: number;
  descripcion: string;
  monto: number;
  categoria: string;
};

export default function DashboardPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);

  useEffect(() => {
    fetch("http://localhost:3002/api/gastos")
      .then((res) => res.json())
      .then((data) => {
        setGastos(data.data);
      })
      .catch((err) => console.error(err));
  }, []);

  const total = gastos.reduce((sum, g) => sum + g.monto, 0);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto w-full max-w-6xl rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-semibold mb-4">Resumen de gastos</h2>

        <div className="text-2xl font-bold mb-6">
          Total: ${total.toFixed(2)}
        </div>

        <div className="space-y-2">
          {gastos.map((g) => (
            <div
              key={g.id}
              className="flex justify-between border rounded p-3"
            >
              <span>{g.descripcion}</span>
              <span>${g.monto}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}