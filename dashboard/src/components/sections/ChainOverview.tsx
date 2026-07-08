"use client";

import { useState } from "react";
import { HorizontalBarChart } from "@/components/HorizontalBarChart";
import { MetricToggle } from "@/components/MetricToggle";
import { RankingTable } from "@/components/RankingTable";
import { formatCLP, formatUnits } from "@/lib/format";
import type { Insights, Metric, Vista } from "@/types";

export function ChainOverview({
  insights,
  vista,
}: {
  insights: Insights;
  vista: Vista;
}) {
  const [metric, setMetric] = useState<Metric>("unidades");
  const rows = vista === "macro" ? insights.macroChain : insights.chain;
  const top12 = rows.slice(0, 12);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Consolidado de la cadena
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Ranking de {vista === "macro" ? "macro-temáticas" : "temáticas"} de toda
          la cadena
        </p>
      </div>

      <div className="glass-strong p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800">
            Top 12 {vista === "macro" ? "macro-temáticas" : "temáticas"} por{" "}
            {metric === "monto" ? "monto vendido" : "unidades vendidas"}
          </h3>
          <MetricToggle metric={metric} onChange={setMetric} />
        </div>
        <HorizontalBarChart data={top12} metric={metric} />
      </div>

      <RankingTable
        rows={rows}
        topN={20}
        temaLabel={vista === "macro" ? "Macro-temática" : "Temática"}
        exportName={vista === "macro" ? "consolidado_macro" : "consolidado_detalle"}
        exportContext="Consolidado de toda la cadena (incluye CDD ENEA)."
      />

      <div className="glass p-5">
        <h3 className="text-sm font-semibold text-slate-800">
          Top 10 títulos de la cadena
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Los más vendidos en unidades, todo el período.
        </p>
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
              {insights.topTitles.chain.slice(0, 10).map((t) => (
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
    </div>
  );
}
