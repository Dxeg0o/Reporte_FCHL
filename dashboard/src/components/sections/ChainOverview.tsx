import { HorizontalBarChart } from "@/components/HorizontalBarChart";
import { RankingTable } from "@/components/RankingTable";
import type { Insights } from "@/types";

export function ChainOverview({ insights }: { insights: Insights }) {
  const top12 = insights.chain.slice(0, 12);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Cuadro general consolidado de la cadena
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Ranking de temáticas por unidades vendidas, 2023-2026, todos los locales
          y canales incluidos.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">
          Top 12 temáticas por unidades vendidas
        </h3>
        <HorizontalBarChart data={top12} />
      </div>

      <RankingTable rows={insights.chain} topN={20} />
    </div>
  );
}
