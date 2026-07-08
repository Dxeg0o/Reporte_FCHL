export type LocalTipo = "fisica" | "web" | "cdd";
export type Vista = "macro" | "detalle";
export type Metric = "unidades" | "monto";

export interface LocalMeta {
  local: string;
  tipo: LocalTipo;
}

export interface AggregatedRow {
  local: string;
  macro: string;
  categoria: string;
  anio: number;
  unidades: number;
  monto: number;
}

export interface MonthlyRow {
  local: string;
  macro: string;
  ym: string; // YYYY-MM
  unidades: number;
  monto: number;
}

export interface ExclusionByCategory {
  categoria: string;
  registros: number;
  unidades: number;
}

export interface YearTotal {
  anio: number;
  unidades: number;
  monto: number;
}

export interface Metadata {
  generatedAt: string;
  sourceFile: string;
  rawRows: number;
  excludedRows: number;
  excludedUnits: number;
  bookRows: number;
  bookUnitsTotal: number;
  bookAmountTotal: number;
  period: { min: string; max: string };
  yearsPresent: number[];
  partialYear: number;
  partialYearNote: string;
  locales: LocalMeta[];
  sinTematicaCount: number;
  exclusionCriteria: string[];
  categoryMerges: Record<string, string>;
  exclusionByCategory: ExclusionByCategory[];
  negativeOrZeroFound: boolean;
  emptyCategoryFound: boolean;
  chainYearTotals: YearTotal[];
  chainDeclinePct: number | null;
  macro: {
    numFamilias: number;
    categoriasNoMapeadas: number;
    unidadesNoMapeadas: number;
    nota: string;
  };
}

/** Fila de ranking consolidado (macro o detalle). `tema` = macro-familia o categoría. */
export interface RankingRow {
  rank: number;
  tema: string;
  unidades: number;
  pctUnidades: number;
  monto: number;
  pctMonto: number;
}

export interface DominantByLocal {
  local: string;
  categoriaDominante: string;
  pct: number;
  unidades: number;
}

export interface ConcentrationByLocal {
  local: string;
  top5Pct: number;
  hhi: number;
  categoriasActivas: number;
}

export interface WebFisicasCategoria {
  categoria: string;
  cantidad: number;
  pct: number;
}

export interface WebVsFisicas {
  webTop10: WebFisicasCategoria[];
  fisicasTop10: WebFisicasCategoria[];
  webTotalUnidades: number;
  fisicasTotalUnidades: number;
}

export interface GrowthRow {
  tema: string;
  unidades2023: number;
  unidades2025: number;
  variacionPct: number | null;
  share2023: number;
  share2025: number;
  deltaShare: number;
}

export interface YtdScope {
  nombre: string;
  u2025: number;
  u2026: number;
  varPct: number | null;
}

export interface Ytd {
  meses: string;
  chain: { u2025: number; u2026: number; varPct: number | null };
  byLocal: YtdScope[];
  byMacro: YtdScope[];
}

export interface WeakTheme {
  local: string;
  macro: string;
  localPct: number;
  chainPct: number;
  gap: number;
}

export interface TopTitle {
  sku: string;
  nombre: string;
  macro: string;
  unidades: number;
  monto: number;
}

export interface TopTitles {
  chain: TopTitle[];
  byLocal: Record<string, TopTitle[]>;
  byMacro: Record<string, TopTitle[]>;
}

export interface Insights {
  chain: RankingRow[];
  macroChain: RankingRow[];
  totalUnidades: number;
  totalMonto: number;
  chainYearTotals: YearTotal[];
  chainDeclinePct: number | null;
  dominantByLocal: DominantByLocal[];
  concentrationByLocal: ConcentrationByLocal[];
  webVsFisicas: WebVsFisicas;
  growthMacro: GrowthRow[];
  growthDetail: GrowthRow[];
  ytd: Ytd;
  weakByLocal: WeakTheme[];
  topTitles: TopTitles;
  topMacros: string[];
}
