"use client";

import { useMemo, useState } from "react";
import { YearlyLineChart } from "@/components/YearlyLineChart";
import { yearlySeries } from "@/lib/aggregate";
import { formatPct, formatUnits } from "@/lib/format";
import type { AggregatedRow, Insights, Metadata, Vista } from "@/types";

export function YearlyEvolution({
  aggregated,
  insights,
  metadata,
  vista,
}: {
  aggregated: AggregatedRow[];
  insights: Insights;
  metadata: Metadata;
  vista: Vista;
}) {
  const allTemas =
    vista === "macro"
      ? insights.topMacros
      : insights.chain.slice(0, 15).map((r) => r.tema);
  const [selected, setSelected] = useState<string[]>(allTemas.slice(0, 5));

  const series = useMemo(
    () => yearlySeries(aggregated, vista, allTemas),
    [aggregated, vista, allTemas]
  );

  const growth = vista === "macro" ? insights.growthMacro : insights.growthDetail;
  const growing = growth
    .filter((g) => g.deltaShare > 0)
    .slice()
    .sort((a, b) => b.deltaShare - a.deltaShare)
    .slice(0, 5);
  const declining = growth
    .filter((g) => g.deltaShare < 0)
    .slice()
    .sort((a, b) => a.deltaShare - b.deltaShare)
    .slice(0, 5);

  function toggle(tema: string) {
    setSelected((cur) =>
      cur.includes(tema) ? cur.filter((c) => c !== tema) : [...cur, tema]
    );
  }

  const decline = metadata.chainDeclinePct;
  const ytd = insights.ytd.chain;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Evolución anual 2023-2026
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Unidades vendidas por año para las{" "}
          {vista === "macro" ? "macro-temáticas" : "temáticas de detalle"} líderes
          de la cadena.{" "}
          <span className="font-medium text-amber-700">{metadata.partialYearNote}</span>{" "}
          Los puntos huecos marcan 2026 (año parcial).
        </p>
      </div>

      {decline != null && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">Contexto de mercado:</span> la cadena
          vendió {formatPct(Math.abs(decline))} menos unidades en 2025 que en
          2023. Por eso las tablas de abajo ordenan por{" "}
          <span className="font-medium">variación de participación</span> (puntos
          de % del año), no solo por unidades absolutas: casi toda temática cae en
          volumen, pero algunas ganan peso relativo dentro de una torta más
          chica.
          {ytd.varPct != null && (
            <>
              {" "}
              El dato más reciente: {insights.ytd.meses} 2026 vs. 2025 muestra{" "}
              <span className="font-medium">{formatPct(ytd.varPct)}</span> (
              {formatUnits(ytd.u2026)} vs {formatUnits(ytd.u2025)} u.).
            </>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          {allTemas.map((tema) => (
            <button
              key={tema}
              onClick={() => toggle(tema)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selected.includes(tema)
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tema}
            </button>
          ))}
        </div>
        <YearlyLineChart
          series={series}
          years={metadata.yearsPresent}
          temas={selected}
          partialYear={metadata.partialYear}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">
            Ganan peso relativo (2023 → 2025, años completos)
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {growing.map((g) => (
              <li key={g.tema} className="flex items-center justify-between gap-2">
                <span>{g.tema}</span>
                <span className="shrink-0 text-right">
                  <span className="tabular-nums font-medium text-emerald-600">
                    +{g.deltaShare.toFixed(1)} pts
                  </span>
                  <span className="ml-2 text-xs tabular-nums text-slate-400">
                    ({g.variacionPct != null ? formatPct(g.variacionPct) : "-"} u.)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">
            Pierden peso relativo (2023 → 2025, años completos)
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {declining.map((g) => (
              <li key={g.tema} className="flex items-center justify-between gap-2">
                <span>{g.tema}</span>
                <span className="shrink-0 text-right">
                  <span className="tabular-nums font-medium text-red-600">
                    {g.deltaShare.toFixed(1)} pts
                  </span>
                  <span className="ml-2 text-xs tabular-nums text-slate-400">
                    ({g.variacionPct != null ? formatPct(g.variacionPct) : "-"} u.)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Nota: &quot;pts&quot; = variación en puntos de participación (% del total
        de unidades del año); &quot;u.&quot; = variación en unidades absolutas.
        La comparación usa 2023 y 2025 por ser los últimos dos años completos
        disponibles.
      </p>
    </div>
  );
}
