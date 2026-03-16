"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Gasto = {
  id: number;
  descripcion: string;
  monto: number;
  categoria: string;
};

export default function DashboardPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/auth/login");
      return;
    }

    fetch("http://localhost:3002/api/gastos", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.data)) {
          setGastos(data.data);
        } else {
          setGastos([]);
        }
      })
      .catch((err) => console.error(err));
  }, [router]);

  const total = (gastos ?? []).reduce((sum, g) => sum + g.monto, 0);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto w-full max-w-6xl rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-semibold mb-4">Resumen de gastos</h2>

        <div className="text-2xl font-bold mb-6">
          Total: ${total.toFixed(2)}
        </div>

        <div className="space-y-2">
          {gastos.map((g) => (
            <div key={g.id} className="flex justify-between border rounded p-3">
              <span>{g.descripcion}</span>
              <span>${g.monto}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}