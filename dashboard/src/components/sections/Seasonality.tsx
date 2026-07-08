"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MetricToggle } from "@/components/MetricToggle";
import { GlassTooltip } from "@/components/GlassTooltip";
import { monthlySeries } from "@/lib/aggregate";
import { colorForTema } from "@/lib/colors";
import { downloadCSV, toCSV } from "@/lib/csvExport";
import { formatMetric, formatPct } from "@/lib/format";
import type { Insights, LocalMeta, Metadata, Metric, MonthlyRow } from "@/types";

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

// Estacionalidad se calcula solo con años completos (2023-2025): 2026 aún no
// alcanza noviembre/diciembre, incluirlo sesgaría esos meses a la baja.
const FULL_YEARS = [2023, 2024, 2025];

export function Seasonality({
  monthly,
  metadata,
  insights,
  vista,
}: {
  monthly: MonthlyRow[];
  metadata: Metadata;
  insights: Insights;
  vista: string;
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
      monthlySeries(monthly, topMacros, {
        local: selectedLocal ?? undefined,
        years: FULL_YEARS,
        metric,
      }),
    [monthly, topMacros, selectedLocal, metric]
  );

  const totalAnual = data.reduce((s, m) => s + m.total, 0);
  const diciembre = data.find((m) => m.mes === 12);
  const pctDiciembre = totalAnual ? ((diciembre?.total ?? 0) / totalAnual) * 100 : 0;

  const chartData = data.map((m) => {
    const point: Record<string, number | string> = {
      mes: MESES[m.mes - 1],
      total: m.total,
    };
    for (const macro of selectedMacros) point[macro] = m.porTema[macro] ?? 0;
    return point;
  });

  function toggleMacro(m: string) {
    setSelectedMacros((cur) =>
      cur.includes(m) ? cur.filter((c) => c !== m) : [...cur, m]
    );
  }

  function handleExport() {
    const totalHeader = metric === "monto" ? "Monto total" : "Unidades totales";
    const headers = ["Mes", totalHeader, ...topMacros];
    const rows = data.map((m) => [
      MESES[m.mes - 1],
      m.total,
      ...topMacros.map((t) => m.porTema[t] ?? 0),
    ]);
    downloadCSV(
      `estacionalidad_${selectedLocal ?? "cadena"}`,
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

  void vista; // esta sección siempre trabaja a nivel macro (monthly.json no tiene detalle de 565 categorías)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Estacionalidad mensual
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {metric === "monto" ? "Monto vendido" : "Unidades vendidas"} por mes,
          sumando 2023-2025 (años completos). 2026 se excluye para no sesgar los
          meses de fin de año.
        </p>
      </div>

      <div className="glass rounded-2xl border-l-4 border-l-amber-400/80 px-4 py-3 text-sm text-slate-700">
        <span className="font-semibold text-amber-700">Diciembre concentra {formatPct(pctDiciembre)}</span>{" "}
        {metric === "monto" ? "del monto anual" : "de las unidades anuales"}
        {selectedLocal ? ` en ${selectedLocal}` : " de la cadena"}. Es la señal
        más fuerte de estacionalidad: conviene asegurar stock desde octubre para
        no perder venta en la campaña de fin de año.
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
            {metric === "monto" ? "Monto" : "Unidades"} por mes{" "}
            {selectedLocal ? `- ${selectedLocal}` : "- cadena"}
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
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => formatMetric(v, metric)} tick={{ fontSize: 11 }} width={70} />
              <Tooltip content={<GlassTooltip metric={metric} />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
              <Bar dataKey="total" fill="#93c5fd" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-strong p-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">
          Curva mensual por macro-temática
        </h3>
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
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => formatMetric(v, metric)} tick={{ fontSize: 11 }} width={70} />
              <Tooltip content={<GlassTooltip metric={metric} />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {selectedMacros.map((m) => (
                <Line
                  key={m}
                  type="monotone"
                  dataKey={m}
                  stroke={colorForTema(m)}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
