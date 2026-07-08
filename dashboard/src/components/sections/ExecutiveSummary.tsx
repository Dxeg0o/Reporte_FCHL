import { KpiCard } from "@/components/KpiCard";
import { formatCLP, formatPct, formatUnits } from "@/lib/format";
import type { Insights, Metadata } from "@/types";

export function ExecutiveSummary({
  metadata,
  insights,
}: {
  metadata: Metadata;
  insights: Insights;
}) {
  const top5 = insights.macroChain.slice(0, 5);
  const nonCdd = (local: string) =>
    metadata.locales.find((l) => l.local === local)?.tipo !== "cdd";
  const mostConcentrated = [...insights.concentrationByLocal]
    .filter((c) => nonCdd(c.local))
    .sort((a, b) => b.top5Pct - a.top5Pct)[0];
  const mostDiversified = [...insights.concentrationByLocal]
    .filter((c) => nonCdd(c.local))
    .sort((a, b) => a.top5Pct - b.top5Pct)[0];
  const webTop = insights.webVsFisicas.webTop10[0];
  const fisicasTop = insights.webVsFisicas.fisicasTop10[0];

  const nLocalesFisicos = metadata.locales.filter((l) => l.tipo === "fisica").length;
  const nCanales = metadata.locales.length;
  const decline = metadata.chainDeclinePct;
  const yt = metadata.chainYearTotals;
  const u2023 = yt.find((y) => y.anio === 2023)?.unidades;
  const u2025 = yt.find((y) => y.anio === 2025)?.unidades;
  const ytd = insights.ytd;

  // Temáticas macro en crecimiento/caída por participación (delta puntos %)
  const topGrow = insights.growthMacro
    .filter((g) => g.deltaShare > 0)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Resumen ejecutivo</h2>
        <p className="mt-1 text-sm text-slate-600">
          Período analizado: {metadata.period.min} a {metadata.period.max}.{" "}
          <span className="font-medium text-amber-700">{metadata.partialYearNote}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Unidades vendidas (libros)" value={formatUnits(metadata.bookUnitsTotal)} />
        <KpiCard label="Monto vendido (neto)" value={formatCLP(metadata.bookAmountTotal)} />
        <KpiCard
          label="Puntos de venta"
          value={String(nCanales)}
          sublabel={`${nLocalesFisicos} sucursales + Tienda Web + CDD ENEA`}
        />
        {decline != null && (
          <KpiCard
            label="Mercado 2023 → 2025"
            value={formatPct(decline)}
            sublabel={
              u2023 && u2025
                ? `${formatUnits(u2023)} → ${formatUnits(u2025)} u. (años completos)`
                : undefined
            }
          />
        )}
        {ytd.chain.varPct != null && (
          <KpiCard
            label="YTD ene–jun 2026 vs 2025"
            value={formatPct(ytd.chain.varPct)}
            sublabel={`${formatUnits(ytd.chain.u2026)} vs ${formatUnits(ytd.chain.u2025)} u.`}
          />
        )}
      </div>

      {decline != null && decline < 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">Contexto de mercado:</span> la cadena vendió{" "}
          {formatPct(Math.abs(decline))} menos unidades en 2025 que en 2023. Por eso el
          análisis de crecimiento/caída se lee mejor en{" "}
          <span className="font-medium">participación (% del año)</span> que en unidades
          absolutas: casi toda temática cae en volumen, pero algunas{" "}
          <span className="font-medium">ganan peso relativo</span>.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">
            Macro-temáticas dominantes de la cadena
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {top5.map((c) => (
              <li key={c.tema} className="flex items-center justify-between">
                <span className="text-slate-700">
                  {c.rank}. {c.tema}
                </span>
                <span className="tabular-nums font-medium text-slate-900">
                  {formatPct(c.pctUnidades)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Estas 5 familias concentran{" "}
            {formatPct(top5.reduce((s, c) => s + c.pctUnidades, 0))} de las unidades
            vendidas.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">Hallazgos clave</h3>
          <ul className="mt-3 space-y-3 text-sm text-slate-700">
            <li>
              <span className="font-medium">Local más concentrado:</span>{" "}
              {mostConcentrated?.local} - su top 5 de macro-temáticas explica{" "}
              {formatPct(mostConcentrated?.top5Pct ?? 0)} de las unidades del local.
            </li>
            <li>
              <span className="font-medium">Local más diversificado:</span>{" "}
              {mostDiversified?.local} - su top 5 solo concentra{" "}
              {formatPct(mostDiversified?.top5Pct ?? 0)} de las unidades.
            </li>
            <li>
              <span className="font-medium">Tienda Web vs. físicas:</span> lidera en la web
              «{webTop?.categoria}» ({formatPct(webTop?.pct ?? 0)}); en tiendas físicas
              lidera «{fisicasTop?.categoria}» ({formatPct(fisicasTop?.pct ?? 0)}).
            </li>
            {topGrow.length > 0 && (
              <li>
                <span className="font-medium">Ganan peso relativo:</span>{" "}
                {topGrow
                  .map((g) => `${g.tema} (+${g.deltaShare.toFixed(1)} pts)`)
                  .join(", ")}{" "}
                (participación 2023 → 2025).
              </li>
            )}
            <li>
              <span className="font-medium">Calidad de datos:</span>{" "}
              {formatUnits(metadata.excludedRows)} registros excluidos por no ser libros;
              ver sección «Calidad de datos» para el detalle.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
