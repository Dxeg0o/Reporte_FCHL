import type { AggregatedRow, LocalMeta, MonthlyRow, Vista } from "@/types";

export interface ThemeRow {
  tema: string;
  unidades: number;
  monto: number;
  pctUnidades: number;
  pctMonto: number;
}

const CDD = "CDD ENEA";

function dimKey(row: AggregatedRow, vista: Vista): string {
  return vista === "macro" ? row.macro : row.categoria;
}

/** Ranking de temáticas (macro o detalle) para un local, o para toda la cadena si local === undefined. */
export function themesFor(
  rows: AggregatedRow[],
  vista: Vista,
  opts: { local?: string; year?: number; includeCdd?: boolean } = {}
): ThemeRow[] {
  const { local, year, includeCdd = true } = opts;
  const filtered = rows.filter(
    (r) =>
      (local === undefined || r.local === local) &&
      (year === undefined || r.anio === year) &&
      (includeCdd || r.local !== CDD)
  );
  const map = new Map<string, { unidades: number; monto: number }>();
  for (const r of filtered) {
    const key = dimKey(r, vista);
    const cur = map.get(key) ?? { unidades: 0, monto: 0 };
    cur.unidades += r.unidades;
    cur.monto += r.monto;
    map.set(key, cur);
  }
  const totalU = [...map.values()].reduce((s, v) => s + v.unidades, 0);
  const totalM = [...map.values()].reduce((s, v) => s + v.monto, 0);
  return [...map.entries()]
    .map(([tema, v]) => ({
      tema,
      unidades: v.unidades,
      monto: v.monto,
      pctUnidades: totalU ? (v.unidades / totalU) * 100 : 0,
      pctMonto: totalM ? (v.monto / totalM) * 100 : 0,
    }))
    .sort((a, b) => b.unidades - a.unidades);
}

export function localTotals(
  rows: AggregatedRow[],
  opts: { year?: number } = {}
) {
  const { year } = opts;
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

/** Pivotea aggregated.json a tema → año → unidades, para gráficos de evolución anual. */
export function yearlySeries(
  rows: AggregatedRow[],
  vista: Vista,
  temas: string[],
  opts: { local?: string } = {}
): Record<string, Record<number, number>> {
  const { local } = opts;
  const wanted = new Set(temas);
  const out: Record<string, Record<number, number>> = {};
  for (const tema of temas) out[tema] = {};
  for (const r of rows) {
    if (local !== undefined && r.local !== local) continue;
    const key = dimKey(r, vista);
    if (!wanted.has(key)) continue;
    out[key][r.anio] = (out[key][r.anio] ?? 0) + r.unidades;
  }
  return out;
}

/** Agrega monthly.json por mes-del-año (1-12), sumando los años indicados. Solo a nivel macro. */
export function monthlySeries(
  rows: MonthlyRow[],
  temas: string[],
  opts: { local?: string; years?: number[] } = {}
): { mes: number; total: number; porTema: Record<string, number> }[] {
  const { local, years } = opts;
  const yearSet = years ? new Set(years) : null;
  const wanted = new Set(temas);
  const byMonth = new Map<number, { total: number; porTema: Record<string, number> }>();
  for (let m = 1; m <= 12; m++) byMonth.set(m, { total: 0, porTema: {} });
  for (const r of rows) {
    if (local !== undefined && r.local !== local) continue;
    const [yStr, mStr] = r.ym.split("-");
    const anio = Number(yStr);
    const mes = Number(mStr);
    if (yearSet && !yearSet.has(anio)) continue;
    const entry = byMonth.get(mes)!;
    entry.total += r.unidades;
    if (wanted.has(r.macro)) {
      entry.porTema[r.macro] = (entry.porTema[r.macro] ?? 0) + r.unidades;
    }
  }
  return [...byMonth.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([mes, v]) => ({ mes, total: v.total, porTema: v.porTema }));
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
