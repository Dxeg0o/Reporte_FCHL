"use client";

import { useMemo } from "react";
import { HorizontalBarChart } from "@/components/HorizontalBarChart";
import { RankingTable } from "@/components/RankingTable";
import { localTotals, localTypeLabel, themesFor } from "@/lib/aggregate";
import { formatCLP, formatPct, formatUnits } from "@/lib/format";
import type { AggregatedRow, Insights, LocalMeta, Vista } from "@/types";

export function ByLocal({
  aggregated,
  insights,
  locales,
  vista,
  selectedLocal,
  onSelectLocal,
}: {
  aggregated: AggregatedRow[];
  insights: Insights;
  locales: LocalMeta[];
  vista: Vista;
  selectedLocal: string | null;
  onSelectLocal: (local: string) => void;
}) {
  const totals = useMemo(() => localTotals(aggregated), [aggregated]);
  const selected = selectedLocal ?? totals[0]?.local ?? locales[0]?.local;

  const rows = useMemo(
    () => themesFor(aggregated, vista, { local: selected }),
    [aggregated, vista, selected]
  );
  const localMeta = locales.find((l) => l.local === selected);
  const totalRow = totals.find((t) => t.local === selected);
  const weak = insights.weakByLocal.filter((w) => w.local === selected);
  const topTitles = insights.topTitles.byLocal[selected] ?? [];

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
            onClick={() => onSelectLocal(l.local)}
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
            {vista === "macro" ? "Macro-temáticas activas" : "Temáticas activas"}
          </p>
          <p className="mt-1 text-sm font-semibold">{rows.length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">
          Top temáticas - {selected}
        </h3>
        <HorizontalBarChart data={rows.slice(0, 12)} />
      </div>

      <RankingTable
        rows={rows}
        topN={15}
        temaLabel={vista === "macro" ? "Macro-temática" : "Temática"}
        exportName={`local_${selected}_${vista}`}
        exportContext={`Distribución temática de ${selected}.`}
      />

      {localMeta?.tipo !== "cdd" && weak.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">
            Temáticas de baja rotación en {selected}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Macro-temáticas que rotan bien en el conjunto de la cadena pero muy
            por debajo de su participación esperada en este local. Candidatas a
            revisar surtido/reposición.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4">Macro-temática</th>
                  <th className="py-2 pr-4 text-right">% en el local</th>
                  <th className="py-2 pr-4 text-right">% en la cadena</th>
                  <th className="py-2 text-right">Brecha (pts)</th>
                </tr>
              </thead>
              <tbody>
                {weak.map((w) => (
                  <tr key={w.macro} className="border-b border-slate-100">
                    <td className="py-1.5 pr-4">{w.macro}</td>
                    <td className="py-1.5 pr-4 text-right tabular-nums">
                      {formatPct(w.localPct)}
                    </td>
                    <td className="py-1.5 pr-4 text-right tabular-nums text-slate-500">
                      {formatPct(w.chainPct)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums font-medium text-red-600">
                      -{formatPct(w.gap)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {topTitles.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">
            Top títulos en {selected}
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4">Título</th>
                  <th className="py-2 pr-4">Macro-temática</th>
                  <th className="py-2 pr-4 text-right">Unidades</th>
                  <th className="py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {topTitles.slice(0, 10).map((t) => (
                  <tr key={t.sku} className="border-b border-slate-100">
                    <td className="py-1.5 pr-4">{t.nombre}</td>
                    <td className="py-1.5 pr-4 text-slate-500">{t.macro}</td>
                    <td className="py-1.5 pr-4 text-right tabular-nums">
                      {formatUnits(t.unidades)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {formatCLP(t.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
