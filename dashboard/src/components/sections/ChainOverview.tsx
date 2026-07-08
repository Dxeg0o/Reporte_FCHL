import { HorizontalBarChart } from "@/components/HorizontalBarChart";
import { RankingTable } from "@/components/RankingTable";
import { formatCLP, formatUnits } from "@/lib/format";
import type { Insights, Vista } from "@/types";

export function ChainOverview({
  insights,
  vista,
}: {
  insights: Insights;
  vista: Vista;
}) {
  const rows = vista === "macro" ? insights.macroChain : insights.chain;
  const top12 = rows.slice(0, 12);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Cuadro general consolidado de la cadena
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Ranking de {vista === "macro" ? "macro-temáticas" : "temáticas de detalle"}{" "}
          por unidades vendidas, 2023-2026, todos los locales y canales incluidos.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">
          Top 12 {vista === "macro" ? "macro-temáticas" : "temáticas"} por unidades
          vendidas
        </h3>
        <HorizontalBarChart data={top12} />
      </div>

      <RankingTable
        rows={rows}
        topN={20}
        temaLabel={vista === "macro" ? "Macro-temática" : "Temática"}
        exportName={vista === "macro" ? "consolidado_macro" : "consolidado_detalle"}
        exportContext="Consolidado de toda la cadena, 2023-2026 (incluye CDD ENEA)."
      />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">
          Top 10 títulos de la cadena
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Los SKU más vendidos en unidades, todo el período, todos los canales.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">Título</th>
                <th className="py-2 pr-4">Macro-temática</th>
                <th className="py-2 pr-4 text-right">Unidades</th>
                <th className="py-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {insights.topTitles.chain.slice(0, 10).map((t) => (
                <tr key={t.sku} className="border-b border-slate-100">
                  <td className="py-1.5 pr-4">{t.nombre}</td>
                  <td className="py-1.5 pr-4 text-slate-500">{t.macro}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">
                    {formatUnits(t.unidades)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {formatCLP(t.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
