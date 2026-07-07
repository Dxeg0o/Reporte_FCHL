export type LocalTipo = "fisica" | "web" | "cdd";

export interface LocalMeta {
  local: string;
  tipo: LocalTipo;
}

export interface AggregatedRow {
  local: string;
  categoria: string;
  anio: number;
  unidades: number;
  monto: number;
}

export interface ExclusionByCategory {
  categoria: string;
  registros: number;
  unidades: number;
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
}

export interface ChainCategoryRow {
  rank: number;
  categoria: string;
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
  categoria: string;
  unidades2023: number;
  unidades2025: number;
  variacionPct: number | null;
}

export type YearlyRow = { categoria: string } & Record<string, number | string>;

export interface Insights {
  chain: ChainCategoryRow[];
  totalUnidades: number;
  totalMonto: number;
  dominantByLocal: DominantByLocal[];
  concentrationByLocal: ConcentrationByLocal[];
  webVsFisicas: WebVsFisicas;
  yearlyTop15: YearlyRow[];
  growth2023to2025: GrowthRow[];
  top15Categorias: string[];
}
