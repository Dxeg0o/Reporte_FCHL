"use client";

import { useMemo, useState } from "react";
import { YearlyLineChart } from "@/components/YearlyLineChart";
import { MetricToggle } from "@/components/MetricToggle";
import { MarketContextNote } from "@/components/MarketContextNote";
import { yearlySeries } from "@/lib/aggregate";
import { formatPct } from "@/lib/format";
import type { AggregatedRow, Insights, Metadata, Metric, Vista } from "@/types";

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
  const [metric, setMetric] = useState<Metric>("unidades");

  const series = useMemo(
    () => yearlySeries(aggregated, vista, allTemas, { metric }),
    [aggregated, vista, allTemas, metric]
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
        <p className="mt-1 text-sm text-slate-500">
          {metric === "monto" ? "Monto vendido" : "Unidades vendidas"} por año para
          las {vista === "macro" ? "macro-temáticas" : "temáticas"} líderes. Los
          puntos huecos marcan 2026 (parcial).
        </p>
      </div>

      {decline != null && (
        <MarketContextNote
          declinePct={decline}
          ytd={{
            varPct: ytd.varPct,
            u2025: ytd.u2025,
            u2026: ytd.u2026,
            meses: insights.ytd.meses,
          }}
        />
      )}

      <div className="glass-strong p-5">
        <div className="mb-3 flex items-center justify-end">
          <MetricToggle metric={metric} onChange={setMetric} />
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {allTemas.map((tema) => (
            <button
              key={tema}
              onClick={() => toggle(tema)}
              className={`rounded-full px-3 py-1 text-xs font-medium backdrop-blur transition ${
                selected.includes(tema)
                  ? "bg-[var(--color-accent)] text-white shadow-sm"
                  : "border border-white/60 bg-white/50 text-slate-600 hover:bg-white"
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
          metric={metric}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass glass-hover p-5">
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
        <div className="glass glass-hover p-5">
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

      <p className="text-xs text-slate-400">
        &quot;pts&quot; = variación en puntos de participación · &quot;u.&quot; =
        variación en unidades. Se comparan 2023 y 2025 (últimos años completos).
      </p>
    </div>
  );
}
