"use client";

import { useMemo } from "react";
import { themesFor } from "@/lib/aggregate";
import { formatPct, formatUnits } from "@/lib/format";
import type { AggregatedRow, Insights, LocalMeta, Vista } from "@/types";

// Bucket de color por percentil DENTRO de la columna (quién sobre/sub-indexa
// en esa temática respecto a los demás locales), no por escala absoluta.
function bucketColor(rank: number, n: number): string {
  if (n <= 1) return "bg-slate-50 text-slate-300";
  const p = rank / (n - 1); // 0 = mínimo, 1 = máximo
  if (p >= 0.8) return "bg-blue-500 text-white";
  if (p >= 0.6) return "bg-blue-300 text-blue-900";
  if (p >= 0.35) return "bg-blue-100 text-blue-800";
  if (p > 0) return "bg-blue-50 text-blue-700";
  return "bg-slate-50 text-slate-300";
}

export function Comparison({
  aggregated,
  insights,
  locales,
  vista,
}: {
  aggregated: AggregatedRow[];
  insights: Insights;
  locales: LocalMeta[];
  vista: Vista;
}) {
  const fisicasYWeb = locales.filter((l) => l.tipo !== "cdd").map((l) => l.local);
  const rankingRows = vista === "macro" ? insights.macroChain : insights.chain;
  const topTemas = rankingRows.slice(0, 10).map((c) => c.tema);

  const matrix = useMemo(() => {
    return fisicasYWeb.map((local) => {
      const rows = themesFor(aggregated, vista, { local });
      const byTema = new Map(rows.map((r) => [r.tema, r.pctUnidades]));
      return {
        local,
        values: topTemas.map((tema) => byTema.get(tema) ?? 0),
      };
    });
  }, [aggregated, vista, fisicasYWeb, topTemas]);

  // Ranking (0 = más bajo) de cada local dentro de cada columna, para colorear por percentil.
  const colRanks = useMemo(() => {
    return topTemas.map((_, colIdx) => {
      const vals = matrix.map((row) => row.values[colIdx]);
      const sortedIdx = vals
        .map((v, i) => [v, i] as const)
        .sort((a, b) => a[0] - b[0])
        .map(([, i]) => i);
      const rankOf = new Array(vals.length).fill(0);
      sortedIdx.forEach((origIdx, rank) => {
        rankOf[origIdx] = vals[origIdx] > 0 ? rank : -1;
      });
      return rankOf;
    });
  }, [matrix, topTemas]);

  const { webVsFisicas, concentrationByLocal, dominantByLocal } = insights;
  const ytdByLocal = insights.ytd.byLocal.filter((y) => fisicasYWeb.includes(y.nombre));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Comparación entre locales
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Participación (% de unidades del local) de las 10{" "}
          {vista === "macro" ? "macro-temáticas" : "temáticas"} líderes de la
          cadena, por local. El color se calcula por columna: más intenso = mayor
          participación relativa <em>frente a los demás locales</em> en esa
          temática (no una escala absoluta).
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <table className="w-full min-w-[900px] text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white px-2 py-2 text-left font-medium text-slate-600">
                Local
              </th>
              {topTemas.map((tema) => (
                <th
                  key={tema}
                  className="px-2 py-2 text-left font-medium text-slate-600"
                  style={{ writingMode: "vertical-rl" }}
                >
                  <span className="whitespace-nowrap">{tema}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rowIdx) => (
              <tr key={row.local} className="border-t border-slate-100">
                <td className="sticky left-0 whitespace-nowrap bg-white px-2 py-2 font-medium text-slate-800">
                  {row.local}
                </td>
                {row.values.map((v, colIdx) => (
                  <td key={colIdx} className="px-1 py-1">
                    <div
                      className={`rounded px-1.5 py-1 text-center tabular-nums ${bucketColor(
                        colRanks[colIdx][rowIdx],
                        matrix.length
                      )}`}
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
            % de unidades explicado por las 5 macro-temáticas líderes del local
            (mayor = más concentrado).
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {concentrationByLocal
              .filter((c) => fisicasYWeb.includes(c.local))
              .map((c) => (
                <li key={c.local} className="flex items-center justify-between gap-2">
                  <span className="text-slate-700">{c.local}</span>
                  <span className="tabular-nums text-slate-500">
                    top 5: <span className="font-medium text-slate-900">{formatPct(c.top5Pct)}</span>{" "}
                    · {c.categoriasActivas} temáticas de detalle
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

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">
          YTD {insights.ytd.meses} 2026 vs. 2025, por local
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Variación de unidades vendidas en los mismos meses completos de ambos
          años (excluye julio 2026, que aún está en curso).
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {ytdByLocal.map((y) => (
            <div
              key={y.nombre}
              className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <p className="text-xs text-slate-500">{y.nombre}</p>
              <p
                className={`text-sm font-semibold tabular-nums ${
                  (y.varPct ?? 0) < 0 ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {y.varPct != null ? formatPct(y.varPct) : "-"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
