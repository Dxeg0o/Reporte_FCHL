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
  const top5 = insights.chain.slice(0, 5);
  const mostConcentrated = [...insights.concentrationByLocal]
    .filter((c) => metadata.locales.find((l) => l.local === c.local)?.tipo !== "cdd")
    .sort((a, b) => b.top5Pct - a.top5Pct)[0];
  const mostDiversified = [...insights.concentrationByLocal]
    .filter((c) => metadata.locales.find((l) => l.local === c.local)?.tipo !== "cdd")
    .sort((a, b) => a.top5Pct - b.top5Pct)[0];
  const webTop = insights.webVsFisicas.webTop10[0];
  const fisicasTop = insights.webVsFisicas.fisicasTop10[0];

  const nLocalesFisicos = metadata.locales.filter((l) => l.tipo === "fisica").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Resumen ejecutivo</h2>
        <p className="mt-1 text-sm text-slate-600">
          Período analizado: {metadata.period.min} a {metadata.period.max}. {" "}
          <span className="font-medium text-amber-700">{metadata.partialYearNote}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Unidades vendidas (libros)" value={formatUnits(metadata.bookUnitsTotal)} />
        <KpiCard label="Monto vendido (neto)" value={formatCLP(metadata.bookAmountTotal)} />
        <KpiCard label="Sucursales físicas" value={String(nLocalesFisicos)} />
        <KpiCard label="Canales adicionales" value="Tienda Web + CDD ENEA" />
        <KpiCard
          label="Registros de venta analizados"
          value={formatUnits(metadata.bookRows)}
          sublabel={`${formatUnits(metadata.excludedRows)} registros no-libro excluidos`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">
            Temáticas dominantes de la cadena
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {top5.map((c) => (
              <li key={c.categoria} className="flex items-center justify-between">
                <span className="text-slate-700">
                  {c.rank}. {c.categoria}
                </span>
                <span className="tabular-nums font-medium text-slate-900">
                  {formatPct(c.pctUnidades)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Estas 5 temáticas concentran{" "}
            {formatPct(top5.reduce((s, c) => s + c.pctUnidades, 0))} de las unidades
            vendidas por la cadena en todo el período.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">Hallazgos clave</h3>
          <ul className="mt-3 space-y-3 text-sm text-slate-700">
            <li>
              <span className="font-medium">Local más concentrado:</span>{" "}
              {mostConcentrated?.local} — su top 5 de temáticas explica{" "}
              {formatPct(mostConcentrated?.top5Pct ?? 0)} de las unidades del local.
            </li>
            <li>
              <span className="font-medium">Local más diversificado:</span>{" "}
              {mostDiversified?.local} — su top 5 solo concentra{" "}
              {formatPct(mostDiversified?.top5Pct ?? 0)} de las unidades, con{" "}
              {mostDiversified?.categoriasActivas} temáticas activas.
            </li>
            <li>
              <span className="font-medium">Tienda Web vs. físicas:</span> la temática
              líder en la web es &quot;{webTop?.categoria}&quot; ({formatPct(webTop?.pct ?? 0)}
              ), mientras que en tiendas físicas lidera &quot;{fisicasTop?.categoria}&quot; (
              {formatPct(fisicasTop?.pct ?? 0)}).
            </li>
            <li>
              <span className="font-medium">Calidad de datos:</span>{" "}
              {formatUnits(metadata.excludedRows)} registros excluidos por no ser
              libros (bolsas, gift cards, juegos, agendas, material didáctico); ver
              sección &quot;Calidad de datos&quot; para el detalle completo.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
