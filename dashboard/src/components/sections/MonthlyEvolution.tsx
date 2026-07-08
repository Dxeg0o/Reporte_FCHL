"use client";

import { useMemo, useState } from "react";
import { MetricToggle } from "@/components/MetricToggle";
import { MonthlyLineChart } from "@/components/MonthlyLineChart";
import { monthlyTimeSeries } from "@/lib/aggregate";
import { downloadCSV, toCSV } from "@/lib/csvExport";
import type { Insights, LocalMeta, Metadata, Metric, MonthlyRow } from "@/types";

export function MonthlyEvolution({
  monthly,
  metadata,
  insights,
}: {
  monthly: MonthlyRow[];
  metadata: Metadata;
  insights: Insights;
}) {
  const locales: LocalMeta[] = metadata.locales;
  const [selectedLocal, setSelectedLocal] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>("unidades");
  const topMacros = insights.topMacros.slice(0, 8);
  const [selectedMacros, setSelectedMacros] = useState<string[]>(
    topMacros.slice(0, 3)
  );

  const data = useMemo(
    () =>
      monthlyTimeSeries(monthly, topMacros, metric, {
        local: selectedLocal ?? undefined,
      }),
    [monthly, topMacros, metric, selectedLocal]
  );

  function toggleMacro(m: string) {
    setSelectedMacros((cur) =>
      cur.includes(m) ? cur.filter((c) => c !== m) : [...cur, m]
    );
  }

  function handleExport() {
    const totalHeader = metric === "monto" ? "Monto total" : "Unidades totales";
    const headers = ["Mes", totalHeader, ...topMacros];
    const rows = data.map((m) => [
      m.ym,
      m.total,
      ...topMacros.map((t) => m.porTema[t] ?? 0),
    ]);
    downloadCSV(
      `evolucion_mensual_${selectedLocal ?? "cadena"}_${metric}`,
      toCSV(headers, rows)
    );
  }

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
        <h2 className="text-xl font-semibold text-slate-900">
          Evolución mensual
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {metric === "monto" ? "Monto vendido" : "Unidades vendidas"} mes a mes
          ({metadata.period.min} a {metadata.period.max}). La línea punteada es el
          total; las de color, las macro-temáticas elegidas.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Local:</span>
        <button
          onClick={() => setSelectedLocal(null)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium backdrop-blur transition ${
            selectedLocal === null
              ? "bg-[var(--color-accent)] text-white shadow-sm"
              : "border border-white/60 bg-white/50 text-slate-600 hover:bg-white"
          }`}
        >
          Toda la cadena
        </button>
        {sortedLocales.map((l) => (
          <button
            key={l.local}
            onClick={() => setSelectedLocal(l.local)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium backdrop-blur transition ${
              selectedLocal === l.local
                ? "bg-[var(--color-accent)] text-white shadow-sm"
                : "border border-white/60 bg-white/50 text-slate-600 hover:bg-white"
            }`}
          >
            {l.local}
          </button>
        ))}
      </div>

      <div className="glass-strong p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800">
            Serie temporal {selectedLocal ? `- ${selectedLocal}` : "- cadena"}
          </h3>
          <div className="flex items-center gap-2">
            <MetricToggle metric={metric} onChange={setMetric} />
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/60 px-3 py-1.5 text-xs font-medium text-slate-600 backdrop-blur transition hover:bg-white hover:text-[var(--color-accent)]"
            >
              Exportar CSV
            </button>
          </div>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {topMacros.map((m) => (
            <button
              key={m}
              onClick={() => toggleMacro(m)}
              className={`rounded-full px-3 py-1 text-xs font-medium backdrop-blur transition ${
                selectedMacros.includes(m)
                  ? "bg-[var(--color-accent)] text-white shadow-sm"
                  : "border border-white/60 bg-white/50 text-slate-600 hover:bg-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <MonthlyLineChart data={data} temas={selectedMacros} metric={metric} />
      </div>
    </div>
  );
}
