"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Nav, SECTIONS, type SectionId } from "@/components/Nav";
import { VistaToggle } from "@/components/VistaToggle";
import { ExecutiveSummary } from "@/components/sections/ExecutiveSummary";
import { ChainOverview } from "@/components/sections/ChainOverview";
import { ByLocal } from "@/components/sections/ByLocal";
import { Comparison } from "@/components/sections/Comparison";
import { YearlyEvolution } from "@/components/sections/YearlyEvolution";
import { MonthlyEvolution } from "@/components/sections/MonthlyEvolution";
import { Seasonality } from "@/components/sections/Seasonality";
import { Recommendations } from "@/components/sections/Recommendations";
import { DataQuality } from "@/components/sections/DataQuality";
import { buildRecommendations } from "@/lib/recommendations";
import aggregatedData from "@/data/aggregated.json";
import monthlyData from "@/data/monthly.json";
import metadataData from "@/data/metadata.json";
import insightsData from "@/data/insights.json";
import type {
  AggregatedRow,
  Insights,
  Metadata,
  MonthlyRow,
  Vista,
} from "@/types";

const aggregated = aggregatedData as AggregatedRow[];
const monthly = monthlyData as MonthlyRow[];
const metadata = metadataData as Metadata;
const insights = insightsData as Insights;

// Secciones que usan el toggle macro/detalle.
// "estacionalidad" queda fuera: monthly.json solo tiene granularidad de macro-tema,
// no el detalle de las 565 categorías, así que el toggle no tendría efecto ahí.
const THEME_SECTIONS: SectionId[] = [
  "consolidado",
  "por-local",
  "comparacion",
  "evolucion",
];

const VALID_SECTIONS = new Set(SECTIONS.map((s) => s.id));

export function Dashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const rawSection = searchParams.get("seccion");
  const section: SectionId =
    rawSection && VALID_SECTIONS.has(rawSection as SectionId)
      ? (rawSection as SectionId)
      : "resumen";
  const vista: Vista = searchParams.get("vista") === "detalle" ? "detalle" : "macro";
  const localParam = searchParams.get("local");

  function setParam(key: string, value: string | null) {
    const p = new URLSearchParams(searchParams.toString());
    if (value == null) p.delete(key);
    else p.set(key, value);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const recs = useMemo(
    () => buildRecommendations(insights, metadata.locales),
    []
  );

  const showVistaToggle = THEME_SECTIONS.includes(section);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <h1 className="text-lg font-semibold text-slate-900">
          Distribución temática de ventas - Cadena de librerías FCHL
        </h1>
        <p className="text-sm text-slate-500">
          Análisis por local y canal, {metadata.period.min} a {metadata.period.max}
        </p>
      </header>

      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-2">
          <Nav active={section} onSelect={(id) => setParam("seccion", id)} />
          {showVistaToggle && (
            <div className="hidden shrink-0 pr-4 sm:block">
              <VistaToggle vista={vista} onChange={(v) => setParam("vista", v)} />
            </div>
          )}
        </div>
        {showVistaToggle && (
          <div className="px-4 pb-2 sm:hidden">
            <VistaToggle vista={vista} onChange={(v) => setParam("vista", v)} />
          </div>
        )}
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {section === "resumen" && (
          <ExecutiveSummary metadata={metadata} insights={insights} />
        )}
        {section === "consolidado" && (
          <ChainOverview insights={insights} vista={vista} />
        )}
        {section === "por-local" && (
          <ByLocal
            aggregated={aggregated}
            insights={insights}
            locales={metadata.locales}
            vista={vista}
            selectedLocal={localParam}
            onSelectLocal={(l) => setParam("local", l)}
          />
        )}
        {section === "comparacion" && (
          <Comparison
            aggregated={aggregated}
            insights={insights}
            locales={metadata.locales}
            vista={vista}
          />
        )}
        {section === "evolucion" && (
          <YearlyEvolution
            aggregated={aggregated}
            insights={insights}
            metadata={metadata}
            vista={vista}
          />
        )}
        {section === "evolucion-mensual" && (
          <MonthlyEvolution
            monthly={monthly}
            metadata={metadata}
            insights={insights}
          />
        )}
        {section === "estacionalidad" && (
          <Seasonality
            monthly={monthly}
            metadata={metadata}
            insights={insights}
            vista={vista}
          />
        )}
        {section === "recomendaciones" && <Recommendations recs={recs} />}
        {section === "calidad" && <DataQuality metadata={metadata} />}
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-400 sm:px-6">
        Dashboard generado a partir de ventas_desde_2023.csv · datos hasta{" "}
        {metadata.period.max}
      </footer>
    </div>
  );
}
