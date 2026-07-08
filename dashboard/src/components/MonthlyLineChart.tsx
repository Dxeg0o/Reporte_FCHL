"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { colorForTema } from "@/lib/colors";
import { formatMetric } from "@/lib/format";
import type { Metric } from "@/types";

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const TOTAL_KEY = "Total";

/** "2023-01" → "ene 23" */
function formatYm(ym: string): string {
  const [y, m] = ym.split("-");
  const mes = MESES[Number(m) - 1] ?? m;
  return `${mes} ${y.slice(2)}`;
}

export function MonthlyLineChart({
  data,
  temas,
  metric = "unidades",
  showTotal = true,
}: {
  /** salida de lib/aggregate.ts#monthlyTimeSeries */
  data: { ym: string; total: number; porTema: Record<string, number> }[];
  temas: string[];
  metric?: Metric;
  showTotal?: boolean;
}) {
  const chartData = data.map((m) => {
    const point: Record<string, number | string> = {
      ym: m.ym,
      label: formatYm(m.ym),
      [TOTAL_KEY]: m.total,
    };
    for (const tema of temas) point[tema] = m.porTema[tema] ?? 0;
    return point;
  });

  return (
    <div style={{ width: "100%", height: 360 }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={50}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis tickFormatter={(v) => formatMetric(v, metric)} tick={{ fontSize: 11 }} width={70} />
          <Tooltip formatter={(v) => formatMetric(Number(v ?? 0), metric)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {showTotal && (
            <Line
              type="monotone"
              dataKey={TOTAL_KEY}
              stroke="#475569"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />
          )}
          {temas.map((tema) => (
            <Line
              key={tema}
              type="monotone"
              dataKey={tema}
              stroke={colorForTema(tema)}
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
