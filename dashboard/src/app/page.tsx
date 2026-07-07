"use client";

import { useMemo, useState } from "react";
import { Nav, type SectionId } from "@/components/Nav";
import { ExecutiveSummary } from "@/components/sections/ExecutiveSummary";
import { ChainOverview } from "@/components/sections/ChainOverview";
import { ByLocal } from "@/components/sections/ByLocal";
import { Comparison } from "@/components/sections/Comparison";
import { YearlyEvolution } from "@/components/sections/YearlyEvolution";
import { Recommendations } from "@/components/sections/Recommendations";
import { DataQuality } from "@/components/sections/DataQuality";
import { buildRecommendations } from "@/lib/recommendations";
import aggregatedData from "@/data/aggregated.json";
import metadataData from "@/data/metadata.json";
import insightsData from "@/data/insights.json";
import type { AggregatedRow, Insights, Metadata } from "@/types";

const aggregated = aggregatedData as AggregatedRow[];
const metadata = metadataData as Metadata;
const insights = insightsData as Insights;

export default function Home() {
  const [section, setSection] = useState<SectionId>("resumen");
  const recs = useMemo(
    () => buildRecommendations(aggregated, insights, metadata.locales),
    []
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <h1 className="text-lg font-semibold text-slate-900">
          Distribución temática de ventas — Cadena de librerías FCHL
        </h1>
        <p className="text-sm text-slate-500">
          Análisis por local y canal, {metadata.period.min} a {metadata.period.max}
        </p>
      </header>

      <div className="sticky top-0 z-10">
        <Nav active={section} onSelect={setSection} />
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {section === "resumen" && (
          <ExecutiveSummary metadata={metadata} insights={insights} />
        )}
        {section === "consolidado" && <ChainOverview insights={insights} />}
        {section === "por-local" && (
          <ByLocal aggregated={aggregated} locales={metadata.locales} />
        )}
        {section === "comparacion" && (
          <Comparison
            aggregated={aggregated}
            insights={insights}
            locales={metadata.locales}
          />
        )}
        {section === "evolucion" && (
          <YearlyEvolution insights={insights} metadata={metadata} />
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
