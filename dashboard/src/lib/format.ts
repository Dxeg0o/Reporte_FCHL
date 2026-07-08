import type { Metric } from "@/types";

export function formatUnits(n: number): string {
  return new Intl.NumberFormat("es-CL").format(n);
}

export function formatCLP(n: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

/** Formatea un valor según la métrica activa: unidades (número) o monto (CLP). */
export function formatMetric(n: number, metric: Metric): string {
  return metric === "monto" ? formatCLP(n) : formatUnits(n);
}
