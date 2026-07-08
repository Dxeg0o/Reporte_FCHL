"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { colorForTema } from "@/lib/colors";
import { formatMetric, formatPct } from "@/lib/format";
import type { Metric } from "@/types";

export function HorizontalBarChart({
  data,
  metric = "unidades",
}: {
  data: {
    tema: string;
    unidades: number;
    pctUnidades: number;
    monto: number;
    pctMonto: number;
  }[];
  metric?: Metric;
}) {
  const valueKey = metric === "monto" ? "monto" : "unidades";
  const pctKey = metric === "monto" ? "pctMonto" : "pctUnidades";
  const label = metric === "monto" ? "Monto" : "Unidades";
  const suffix = metric === "monto" ? "" : " u.";
  const chartData = [...data].reverse();
  return (
    <div style={{ width: "100%", height: Math.max(280, data.length * 32) }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" tickFormatter={(v) => formatMetric(v, metric)} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="tema"
            width={180}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value, _name, item) => [
              `${formatMetric(Number(value ?? 0), metric)}${suffix} (${formatPct(item.payload[pctKey])})`,
              label,
            ]}
          />
          <Bar dataKey={valueKey} radius={[0, 4, 4, 0]}>
            {chartData.map((d) => (
              <Cell key={d.tema} fill={colorForTema(d.tema)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
