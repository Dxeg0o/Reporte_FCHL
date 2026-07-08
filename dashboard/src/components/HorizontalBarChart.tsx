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
import { formatPct, formatUnits } from "@/lib/format";

export function HorizontalBarChart({
  data,
}: {
  data: { tema: string; unidades: number; pctUnidades: number }[];
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
            dataKey="tema"
            width={180}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value, _name, item) => [
              `${formatUnits(Number(value ?? 0))} u. (${formatPct(item.payload.pctUnidades)})`,
              "Unidades",
            ]}
          />
          <Bar dataKey="unidades" radius={[0, 4, 4, 0]}>
            {chartData.map((d) => (
              <Cell key={d.tema} fill={colorForTema(d.tema)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
