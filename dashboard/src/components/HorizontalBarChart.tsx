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
import { formatPct, formatUnits } from "@/lib/format";

const COLORS = [
  "#2563eb",
  "#0891b2",
  "#0d9488",
  "#65a30d",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
  "#db2777",
  "#9333ea",
  "#4f46e5",
];

export function HorizontalBarChart({
  data,
}: {
  data: { categoria: string; unidades: number; pctUnidades: number }[];
}) {
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
          <XAxis type="number" tickFormatter={(v) => formatUnits(v)} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="categoria"
            width={170}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value, _name, item) => [
              `${formatUnits(Number(value ?? 0))} u. (${formatPct(item.payload.pctUnidades)})`,
              "Unidades",
            ]}
          />
          <Bar dataKey="unidades" radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
