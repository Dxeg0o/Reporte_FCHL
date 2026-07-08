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

type Datum = {
  tema: string;
  unidades: number;
  pctUnidades: number;
  monto: number;
  pctMonto: number;
};

export function HorizontalBarChart({
  data,
  metric = "unidades",
}: {
  data: Datum[];
  metric?: Metric;
}) {
  const valueKey = metric === "monto" ? "monto" : "unidades";
  const pctKey = metric === "monto" ? "pctMonto" : "pctUnidades";
  const label = metric === "monto" ? "Monto" : "Unidades";
  const suffix = metric === "monto" ? "" : " u.";
  const chartData = [...data].reverse();

  function TooltipContent({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { payload: Datum }[];
  }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-lg">
        <p className="mb-1 max-w-[220px] font-semibold text-slate-800">{d.tema}</p>
        <p className="tabular-nums text-slate-600">
          <span className="text-slate-400">{label}: </span>
          <span className="font-semibold text-slate-900">
            {formatMetric(d[valueKey], metric)}
            {suffix}
          </span>{" "}
          ({formatPct(d[pctKey])})
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: Math.max(280, data.length * 34) }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis
            type="number"
            tickFormatter={(v) => formatMetric(v, metric)}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <YAxis
            type="category"
            dataKey="tema"
            width={180}
            tick={{ fontSize: 11, fill: "#475569" }}
          />
          <Tooltip content={<TooltipContent />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
          <Bar
            dataKey={valueKey}
            radius={[0, 6, 6, 0]}
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((d) => (
              <Cell key={d.tema} fill={colorForTema(d.tema)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
