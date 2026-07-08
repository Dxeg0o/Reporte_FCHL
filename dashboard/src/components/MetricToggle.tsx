"use client";

import type { Metric } from "@/types";

export function MetricToggle({
  metric,
  onChange,
}: {
  metric: Metric;
  onChange: (m: Metric) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
      <span className="px-2 text-slate-400">Medir en:</span>
      {(["unidades", "monto"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`rounded-md px-2.5 py-1 font-medium transition ${
            metric === m
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {m === "unidades" ? "Unidades" : "Pesos"}
        </button>
      ))}
    </div>
  );
}
