"use client";

import { useState } from "react";
import { formatCLP, formatPct, formatUnits } from "@/lib/format";

export interface RankingTableRow {
  categoria: string;
  unidades: number;
  pctUnidades: number;
  monto?: number;
  pctMonto?: number;
}

export function RankingTable({
  rows,
  topN = 15,
  showMonto = true,
}: {
  rows: RankingTableRow[];
  topN?: number;
  showMonto?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, topN);
  const rest = rows.slice(topN);
  const othersUnidades = rest.reduce((s, r) => s + r.unidades, 0);
  const othersPct = rest.reduce((s, r) => s + r.pctUnidades, 0);
  const othersMonto = rest.reduce((s, r) => s + (r.monto ?? 0), 0);
  const othersPctMonto = rest.reduce((s, r) => s + (r.pctMonto ?? 0), 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Temática</th>
            <th className="px-4 py-3 font-medium text-right">Unidades</th>
            <th className="px-4 py-3 font-medium text-right">% unidades</th>
            {showMonto && (
              <>
                <th className="px-4 py-3 font-medium text-right">Monto</th>
                <th className="px-4 py-3 font-medium text-right">% monto</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {visible.map((r, i) => (
            <tr
              key={r.categoria}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
            >
              <td className="px-4 py-2.5 text-slate-500">{i + 1}</td>
              <td className="px-4 py-2.5 font-medium text-slate-800">
                {r.categoria}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {formatUnits(r.unidades)}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                {formatPct(r.pctUnidades)}
              </td>
              {showMonto && (
                <>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {r.monto !== undefined ? formatCLP(r.monto) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                    {r.pctMonto !== undefined ? formatPct(r.pctMonto) : "—"}
                  </td>
                </>
              )}
            </tr>
          ))}
          {!expanded && rest.length > 0 && (
            <tr className="border-b border-slate-100 bg-amber-50/50">
              <td className="px-4 py-2.5 text-slate-400">—</td>
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
            </tr>
          )}
        </tbody>
      </table>
      {rest.length > 0 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full border-t border-slate-200 px-4 py-2 text-xs font-medium text-blue-600 hover:bg-slate-50"
        >
          {expanded ? "Mostrar menos" : `Ver todas las temáticas (${rows.length})`}
        </button>
      )}
    </div>
  );
}
