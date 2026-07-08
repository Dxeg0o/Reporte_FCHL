"use client";

import type { Metric } from "@/types";

const OPTIONS: { value: Metric; label: string }[] = [
  { value: "unidades", label: "Unidades" },
  { value: "monto", label: "Pesos" },
];

export function MetricToggle({
  metric,
  onChange,
}: {
  metric: Metric;
  onChange: (m: Metric) => void;
}) {
  const activeIdx = OPTIONS.findIndex((o) => o.value === metric);
  return (
    <div className="inline-flex items-center gap-2 text-xs">
      <span className="text-slate-500">Medir en</span>
      <div className="relative inline-flex rounded-full border border-white/60 bg-white/50 p-0.5 backdrop-blur">
        <span
          className="absolute inset-y-0.5 rounded-full bg-white shadow-sm transition-transform duration-300"
          style={{
            width: `calc((100% - 0.25rem) / ${OPTIONS.length})`,
            transform: `translateX(${activeIdx * 100}%)`,
          }}
        />
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`relative z-10 rounded-full px-3 py-1 font-medium transition-colors ${
              metric === o.value
                ? "text-[var(--color-accent)]"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
