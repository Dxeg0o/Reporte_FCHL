"use client";

import { useCountUp } from "@/lib/useCountUp";

function AnimatedValue({
  countTo,
  format,
}: {
  countTo: number;
  format: (n: number) => string;
}) {
  const v = useCountUp(countTo);
  return <>{format(Math.round(v))}</>;
}

export function KpiCard({
  label,
  value,
  sublabel,
  countTo,
  format,
  accent = false,
}: {
  label: string;
  value?: string;
  sublabel?: string;
  /** Si se entrega junto con `format`, el número se anima al montar. */
  countTo?: number;
  format?: (n: number) => string;
  /** Resalta el valor con el color de acento (para KPIs destacados). */
  accent?: boolean;
}) {
  return (
    <div className="glass glass-hover min-w-0 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1.5 break-words text-2xl font-bold tabular-nums ${
          accent ? "text-[var(--color-accent)]" : "text-slate-900"
        }`}
      >
        {countTo != null && format ? (
          <AnimatedValue countTo={countTo} format={format} />
        ) : (
          value
        )}
      </p>
      {sublabel && <p className="mt-1 text-xs text-slate-500">{sublabel}</p>}
    </div>
  );
}
