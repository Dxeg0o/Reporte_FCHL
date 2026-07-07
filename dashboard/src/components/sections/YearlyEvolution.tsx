"use client";

import { useState } from "react";
import { YearlyLineChart } from "@/components/YearlyLineChart";
import { formatPct, formatUnits } from "@/lib/format";
import type { Insights, Metadata } from "@/types";

export function YearlyEvolution({
  insights,
  metadata,
}: {
  insights: Insights;
  metadata: Metadata;
}) {
  const allCats = insights.top15Categorias;
  const [selectedCats, setSelectedCats] = useState<string[]>(allCats.slice(0, 5));

  const growing = insights.growth2023to2025
    .filter((g) => g.variacionPct !== null)
    .slice()
    .sort((a, b) => (b.variacionPct ?? 0) - (a.variacionPct ?? 0))
    .slice(0, 5);
  const declining = insights.growth2023to2025
    .filter((g) => g.variacionPct !== null)
    .slice()
    .sort((a, b) => (a.variacionPct ?? 0) - (b.variacionPct ?? 0))
    .slice(0, 5);

  function toggle(cat: string) {
    setSelectedCats((cur) =>
      cur.includes(cat) ? cur.filter((c) => c !== cat) : [...cur, cat]
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Evolución anual 2023-2026
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Unidades vendidas por año para las 15 temáticas líderes de la cadena.{" "}
          <span className="font-medium text-amber-700">{metadata.partialYearNote}</span>
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          {allCats.map((cat) => (
            <button
              key={cat}
              onClick={() => toggle(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedCats.includes(cat)
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <YearlyLineChart
          rows={insights.yearlyTop15}
          years={metadata.yearsPresent}
          categorias={selectedCats}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">
            Temáticas en crecimiento (2023 → 2025, años completos)
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {growing.map((g) => (
              <li key={g.categoria} className="flex justify-between">
                <span>{g.categoria}</span>
                <span className="tabular-nums font-medium text-emerald-600">
                  +{formatPct(g.variacionPct ?? 0)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">
            Temáticas en caída (2023 → 2025, años completos)
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {declining.map((g) => (
              <li key={g.categoria} className="flex justify-between">
                <span>{g.categoria}</span>
                <span className="tabular-nums font-medium text-red-600">
                  {formatPct(g.variacionPct ?? 0)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Nota: la comparación de crecimiento/caída usa 2023 y 2025 por ser los
        últimos dos años completos disponibles ({formatUnits(metadata.bookUnitsTotal)}{" "}
        unidades de libros en todo el período 2023-2026).
      </p>
    </div>
  );
}
