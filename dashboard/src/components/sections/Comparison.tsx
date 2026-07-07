"use client";

import { useMemo } from "react";
import { byLocal } from "@/lib/aggregate";
import { formatPct, formatUnits } from "@/lib/format";
import type { AggregatedRow, Insights, LocalMeta } from "@/types";

function heatColor(pct: number): string {
  if (pct === 0) return "bg-slate-50 text-slate-300";
  if (pct < 2) return "bg-blue-50 text-blue-700";
  if (pct < 5) return "bg-blue-100 text-blue-800";
  if (pct < 8) return "bg-blue-300 text-blue-900";
  return "bg-blue-500 text-white";
}

export function Comparison({
  aggregated,
  insights,
  locales,
}: {
  aggregated: AggregatedRow[];
  insights: Insights;
  locales: LocalMeta[];
}) {
  const fisicasYWeb = locales.filter((l) => l.tipo !== "cdd").map((l) => l.local);
  const topCats = insights.chain.slice(0, 10).map((c) => c.categoria);

  const matrix = useMemo(() => {
    return fisicasYWeb.map((local) => {
      const rows = byLocal(aggregated, local);
      const byCat = new Map(rows.map((r) => [r.categoria, r.pctUnidades]));
      return {
        local,
        values: topCats.map((cat) => byCat.get(cat) ?? 0),
      };
    });
  }, [aggregated, fisicasYWeb, topCats]);

  const { webVsFisicas, concentrationByLocal, dominantByLocal } = insights;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Comparación entre locales
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Participación (% de unidades del local) de las 10 temáticas líderes de
          la cadena, por local.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <table className="w-full min-w-[900px] text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white px-2 py-2 text-left font-medium text-slate-600">
                Local
              </th>
              {topCats.map((cat) => (
                <th
                  key={cat}
                  className="px-2 py-2 text-left font-medium text-slate-600"
                  style={{ writingMode: "vertical-rl" }}
                >
                  <span className="whitespace-nowrap">{cat}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.local} className="border-t border-slate-100">
                <td className="sticky left-0 whitespace-nowrap bg-white px-2 py-2 font-medium text-slate-800">
                  {row.local}
                </td>
                {row.values.map((v, i) => (
                  <td key={i} className="px-1 py-1">
                    <div
                      className={`rounded px-1.5 py-1 text-center tabular-nums ${heatColor(v)}`}
                      title={formatPct(v)}
                    >
                      {v > 0 ? v.toFixed(1) : "–"}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">
            Fortalezas por local (temática dominante)
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {dominantByLocal
              .filter((d) => fisicasYWeb.includes(d.local))
              .sort((a, b) => b.pct - a.pct)
              .map((d) => (
                <li key={d.local} className="flex items-center justify-between gap-2">
                  <span className="text-slate-700">
                    {d.local}: <span className="font-medium">{d.categoriaDominante}</span>
                  </span>
                  <span className="shrink-0 tabular-nums font-medium text-slate-900">
                    {formatPct(d.pct)}
                  </span>
                </li>
              ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">
            Concentración vs. diversificación
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            % de unidades explicado por las 5 temáticas líderes del local (mayor
            = más concentrado).
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {concentrationByLocal
              .filter((c) => fisicasYWeb.includes(c.local))
              .map((c) => (
                <li key={c.local} className="flex items-center justify-between gap-2">
                  <span className="text-slate-700">{c.local}</span>
                  <span className="tabular-nums text-slate-500">
                    top 5: <span className="font-medium text-slate-900">{formatPct(c.top5Pct)}</span>{" "}
                    · {c.categoriasActivas} temáticas
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">
          Tienda Web vs. sucursales físicas
        </h3>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">
              Top 5 Tienda Web ({formatUnits(webVsFisicas.webTotalUnidades)} u. totales)
            </p>
            <ol className="mt-2 space-y-1 text-sm">
              {webVsFisicas.webTop10.slice(0, 5).map((c) => (
                <li key={c.categoria} className="flex justify-between">
                  <span>{c.categoria}</span>
                  <span className="tabular-nums text-slate-500">{formatPct(c.pct)}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">
              Top 5 sucursales físicas ({formatUnits(webVsFisicas.fisicasTotalUnidades)} u. totales)
            </p>
            <ol className="mt-2 space-y-1 text-sm">
              {webVsFisicas.fisicasTop10.slice(0, 5).map((c) => (
                <li key={c.categoria} className="flex justify-between">
                  <span>{c.categoria}</span>
                  <span className="tabular-nums text-slate-500">{formatPct(c.pct)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
