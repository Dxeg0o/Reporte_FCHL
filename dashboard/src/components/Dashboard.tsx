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
      <header className="px-4 pt-8 pb-5 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Cadena de librerías FCHL
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Distribución temática de ventas
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {metadata.period.min} – {metadata.period.max} · por local y canal
        </p>
      </header>

      <div className="glass-nav sticky top-0 z-20">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2">
          <div className="min-w-0 flex-1">
            <Nav active={section} onSelect={(id) => setParam("seccion", id)} />
          </div>
          {showVistaToggle && (
            <div className="hidden shrink-0 border-l border-white/40 py-2 pr-4 pl-3 sm:block">
              <VistaToggle vista={vista} onChange={(v) => setParam("vista", v)} />
            </div>
          )}
        </div>
        {showVistaToggle && (
          <div className="mx-auto w-full max-w-6xl px-4 pb-2 sm:hidden">
            <VistaToggle vista={vista} onChange={(v) => setParam("vista", v)} />
          </div>
        )}
      </div>

      <main
        key={section}
        className="animate-fade-in-up mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6"
      >
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

      <footer className="mx-auto mt-4 mb-6 w-full max-w-6xl px-4 text-center text-xs text-slate-400 sm:px-6">
        Reporte de ventas · Cadena de librerías FCHL · datos hasta{" "}
        {metadata.period.max}
      </footer>
    </div>
  );
}
