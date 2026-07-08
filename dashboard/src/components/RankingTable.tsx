"use client";

import { useMemo, useState } from "react";
import { formatCLP, formatPct, formatUnits } from "@/lib/format";
import { downloadCSV, toCSV } from "@/lib/csvExport";

export interface RankingTableRow {
  tema: string;
  unidades: number;
  pctUnidades: number;
  monto: number;
  pctMonto: number;
}

export function RankingTable({
  rows,
  topN = 15,
  showMonto = true,
  showPrecioMedio = true,
  temaLabel = "Temática",
  exportName = "ranking",
  exportContext,
}: {
  rows: RankingTableRow[];
  topN?: number;
  showMonto?: boolean;
  showPrecioMedio?: boolean;
  temaLabel?: string;
  exportName?: string;
  exportContext?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.tema.toLowerCase().includes(q));
  }, [rows, query]);

  const searching = query.trim().length > 0;
  const visible = expanded || searching ? filtered : filtered.slice(0, topN);
  const rest = expanded || searching ? [] : filtered.slice(topN);
  const othersUnidades = rest.reduce((s, r) => s + r.unidades, 0);
  const othersPct = rest.reduce((s, r) => s + r.pctUnidades, 0);
  const othersMonto = rest.reduce((s, r) => s + r.monto, 0);
  const othersPctMonto = rest.reduce((s, r) => s + r.pctMonto, 0);

  function handleExport() {
    const headers = [
      "Ranking",
      temaLabel,
      "Unidades",
      "% unidades",
      ...(showMonto ? ["Monto CLP", "% monto"] : []),
      ...(showPrecioMedio ? ["Precio medio CLP"] : []),
    ];
    const data = rows.map((r, i) => [
      i + 1,
      r.tema,
      r.unidades,
      r.pctUnidades.toFixed(2),
      ...(showMonto ? [r.monto, r.pctMonto.toFixed(2)] : []),
      ...(showPrecioMedio ? [r.unidades ? Math.round(r.monto / r.unidades) : 0] : []),
    ]);
    downloadCSV(exportName, toCSV(headers, data));
  }

  const nCols = 2 + 2 + (showMonto ? 2 : 0) + (showPrecioMedio ? 1 : 0);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Buscar ${temaLabel.toLowerCase()}…`}
          className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400"
        />
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" />
          </svg>
          Exportar CSV
        </button>
      </div>
      {exportContext && (
        <p className="text-xs text-slate-400">{exportContext}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">{temaLabel}</th>
              <th className="px-4 py-3 text-right font-medium">Unidades</th>
              <th className="px-4 py-3 text-right font-medium">% unid.</th>
              {showMonto && (
                <>
                  <th className="px-4 py-3 text-right font-medium">Monto</th>
                  <th className="px-4 py-3 text-right font-medium">% monto</th>
                </>
              )}
              {showPrecioMedio && (
                <th className="px-4 py-3 text-right font-medium">Precio medio</th>
              )}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr
                key={r.tema}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-2.5 text-slate-500">{i + 1}</td>
                <td className="px-4 py-2.5 font-medium text-slate-800">{r.tema}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatUnits(r.unidades)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                  {formatPct(r.pctUnidades)}
                </td>
                {showMonto && (
                  <>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatCLP(r.monto)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                      {formatPct(r.pctMonto)}
                    </td>
                  </>
                )}
                {showPrecioMedio && (
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                    {r.unidades ? formatCLP(Math.round(r.monto / r.unidades)) : "-"}
                  </td>
                )}
              </tr>
            ))}
            {rest.length > 0 && (
              <tr className="border-b border-slate-100 bg-amber-50/50">
                <td className="px-4 py-2.5 text-slate-400">-</td>
                <td className="px-4 py-2.5 font-medium text-slate-600">
                  Otras temáticas ({rest.length})
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatUnits(othersUnidades)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                  {formatPct(othersPct)}
                </td>
                {showMonto && (
                  <>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatCLP(othersMonto)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                      {formatPct(othersPctMonto)}
                    </td>
                  </>
                )}
                {showPrecioMedio && <td className="px-4 py-2.5" />}
              </tr>
            )}
            {visible.length === 0 && (
              <tr>
                <td colSpan={nCols} className="px-4 py-6 text-center text-slate-400">
                  Sin resultados para “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!searching && filtered.length > topN && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-blue-600 hover:bg-slate-50"
        >
          {expanded ? "Mostrar menos" : `Ver todas las temáticas (${rows.length})`}
        </button>
      )}
    </div>
  );
}
