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
        <p className="mt-1 text-sm text-slate-600">
          {metric === "monto" ? "Monto vendido" : "Unidades vendidas"} mes a mes a lo
          largo del tiempo ({metadata.period.min} a {metadata.period.max}). La línea
          punteada es el total de la selección; las líneas de color son las
          macro-temáticas elegidas.{" "}
          <span className="font-medium text-amber-700">
            {metadata.partialYearNote}
          </span>{" "}
          Siempre a nivel de macro-temática (el detalle de 565 categorías no está
          disponible por mes).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Local:</span>
        <button
          onClick={() => setSelectedLocal(null)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
            selectedLocal === null
              ? "bg-blue-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          Toda la cadena
        </button>
        {sortedLocales.map((l) => (
          <button
            key={l.local}
            onClick={() => setSelectedLocal(l.local)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              selectedLocal === l.local
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {l.local}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800">
            Serie temporal {selectedLocal ? `- ${selectedLocal}` : "- cadena"}
          </h3>
          <div className="flex items-center gap-2">
            <MetricToggle metric={metric} onChange={setMetric} />
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
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
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedMacros.includes(m)
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
