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

export function YearlyLineChart({
  series,
  years,
  temas,
  partialYear,
  metric = "unidades",
}: {
  /** tema → año → valor (según métrica), ver lib/aggregate.ts#yearlySeries */
  series: Record<string, Record<number, number>>;
  years: number[];
  temas: string[];
  partialYear?: number;
  metric?: Metric;
}) {
  const data = years.map((y) => {
    const point: Record<string, number | string> = {
      anio: y === partialYear ? `${y}*` : String(y),
    };
    for (const tema of temas) {
      point[tema] = series[tema]?.[y] ?? 0;
    }
    return point;
  });

  return (
    <div style={{ width: "100%", height: 340 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="anio" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => formatMetric(v, metric)} tick={{ fontSize: 11 }} width={70} />
          <Tooltip formatter={(v) => formatMetric(Number(v ?? 0), metric)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {temas.map((tema) => {
            const color = colorForTema(tema);
            return (
              <Line
                key={tema}
                type="monotone"
                dataKey={tema}
                stroke={color}
                strokeWidth={2}
                dot={(props) => {
                  const isPartial = data[props.index]?.anio === `${partialYear}*`;
                  return (
                    <circle
                      key={props.key}
                      cx={props.cx}
                      cy={props.cy}
                      r={3}
                      fill={isPartial ? "#fff" : color}
                      stroke={color}
                      strokeWidth={isPartial ? 2 : 0}
                    />
                  );
                }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
