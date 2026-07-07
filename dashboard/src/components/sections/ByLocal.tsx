"use client";

import { useMemo, useState } from "react";
import { HorizontalBarChart } from "@/components/HorizontalBarChart";
import { RankingTable } from "@/components/RankingTable";
import { byLocal, localTotals, localTypeLabel } from "@/lib/aggregate";
import { formatCLP, formatUnits } from "@/lib/format";
import type { AggregatedRow, LocalMeta } from "@/types";

export function ByLocal({
  aggregated,
  locales,
}: {
  aggregated: AggregatedRow[];
  locales: LocalMeta[];
}) {
  const totals = useMemo(() => localTotals(aggregated), [aggregated]);
  const [selected, setSelected] = useState(totals[0]?.local ?? locales[0]?.local);

  const rows = useMemo(() => byLocal(aggregated, selected), [aggregated, selected]);
  const localMeta = locales.find((l) => l.local === selected);
  const totalRow = totals.find((t) => t.local === selected);

  const sortedLocales = [...locales].sort((a, b) => {
    if (a.tipo !== b.tipo) {
      const order = { fisica: 0, web: 1, cdd: 2 };
      return order[a.tipo] - order[b.tipo];
    }
    return a.local.localeCompare(b.local);
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Cuadro por local</h2>
        <p className="mt-1 text-sm text-slate-600">
          Distribución temática de ventas para cada sucursal, la Tienda Web y el
          CDD ENEA.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {sortedLocales.map((l) => (
          <button
            key={l.local}
            onClick={() => setSelected(l.local)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              selected === l.local
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {l.local}
          </button>
        ))}
      </div>

      {localMeta?.tipo === "cdd" && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          CDD ENEA es un centro de distribución, no una sucursal de venta a
          público. Se muestra como canal separado para transparencia de los datos.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Canal</p>
          <p className="mt-1 text-sm font-semibold">
            {localMeta ? localTypeLabel(localMeta.tipo) : ""}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Unidades vendidas
          </p>
          <p className="mt-1 text-sm font-semibold">
            {formatUnits(totalRow?.unidades ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Monto vendido
          </p>
          <p className="mt-1 text-sm font-semibold">
            {formatCLP(totalRow?.monto ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Temáticas activas
          </p>
          <p className="mt-1 text-sm font-semibold">{rows.length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">
          Top temáticas — {selected}
        </h3>
        <HorizontalBarChart data={rows.slice(0, 12)} />
      </div>

      <RankingTable rows={rows} topN={15} />
    </div>
  );
}
