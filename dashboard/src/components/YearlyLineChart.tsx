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
import { formatUnits } from "@/lib/format";
import type { YearlyRow } from "@/types";

const COLORS = [
  "#2563eb",
  "#dc2626",
  "#0d9488",
  "#ca8a04",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  "#db2777",
];

export function YearlyLineChart({
  rows,
  years,
  categorias,
}: {
  rows: YearlyRow[];
  years: number[];
  categorias: string[];
}) {
  const data = years.map((y) => {
    const point: Record<string, number | string> = { anio: String(y) };
    for (const cat of categorias) {
      const row = rows.find((r) => r.categoria === cat);
      point[cat] = row ? Number(row[String(y)] ?? 0) : 0;
    }
    return point;
  });

  return (
    <div style={{ width: "100%", height: 340 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="anio" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => formatUnits(v)} tick={{ fontSize: 11 }} width={70} />
          <Tooltip formatter={(v) => formatUnits(Number(v ?? 0))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {categorias.map((cat, i) => (
            <Line
              key={cat}
              type="monotone"
              dataKey={cat}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
