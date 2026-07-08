"use client";

import type { Metric } from "@/types";
import { formatMetric } from "@/lib/format";

type Entry = {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
};

/**
 * Tooltip de vidrio reutilizable para los gráficos Recharts. Reemplaza el
 * recuadro blanco plano por defecto. Se pasa como `content={<GlassTooltip .../>}`.
 */
export function GlassTooltip({
  active,
  payload,
  label,
  metric = "unidades",
  suffix = "",
}: {
  active?: boolean;
  payload?: Entry[];
  label?: string | number;
  metric?: Metric;
  suffix?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-lg">
      {label != null && (
        <p className="mb-1 font-semibold text-slate-800">{label}</p>
      )}
      <ul className="space-y-0.5">
        {payload.map((e, i) => (
          <li key={i} className="flex items-center gap-2">
            {e.color && (
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: e.color }}
              />
            )}
            <span className="text-slate-500">{e.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-slate-900">
              {formatMetric(Number(e.value ?? 0), metric)}
              {suffix}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
