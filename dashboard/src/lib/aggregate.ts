import type { AggregatedRow, LocalMeta } from "@/types";

export interface LocalCategoryRow {
  categoria: string;
  unidades: number;
  monto: number;
  pctUnidades: number;
  pctMonto: number;
}

export function byLocal(
  rows: AggregatedRow[],
  local: string,
  year?: number
): LocalCategoryRow[] {
  const filtered = rows.filter(
    (r) => r.local === local && (year === undefined || r.anio === year)
  );
  const map = new Map<string, { unidades: number; monto: number }>();
  for (const r of filtered) {
    const cur = map.get(r.categoria) ?? { unidades: 0, monto: 0 };
    cur.unidades += r.unidades;
    cur.monto += r.monto;
    map.set(r.categoria, cur);
  }
  const totalUnidades = [...map.values()].reduce((s, v) => s + v.unidades, 0);
  const totalMonto = [...map.values()].reduce((s, v) => s + v.monto, 0);
  return [...map.entries()]
    .map(([categoria, v]) => ({
      categoria,
      unidades: v.unidades,
      monto: v.monto,
      pctUnidades: totalUnidades ? (v.unidades / totalUnidades) * 100 : 0,
      pctMonto: totalMonto ? (v.monto / totalMonto) * 100 : 0,
    }))
    .sort((a, b) => b.unidades - a.unidades);
}

export function localTotals(rows: AggregatedRow[], year?: number) {
  const filtered = rows.filter((r) => year === undefined || r.anio === year);
  const map = new Map<string, { unidades: number; monto: number }>();
  for (const r of filtered) {
    const cur = map.get(r.local) ?? { unidades: 0, monto: 0 };
    cur.unidades += r.unidades;
    cur.monto += r.monto;
    map.set(r.local, cur);
  }
  return [...map.entries()]
    .map(([local, v]) => ({ local, ...v }))
    .sort((a, b) => b.unidades - a.unidades);
}

export function localTypeLabel(tipo: LocalMeta["tipo"]): string {
  switch (tipo) {
    case "web":
      return "Tienda Web";
    case "cdd":
      return "Centro de distribución";
    default:
      return "Sucursal física";
  }
}
