import { formatPct, formatUnits } from "@/lib/format";

/**
 * Nota de contexto de mercado, unificada (antes estaba duplicada casi textual
 * en Resumen ejecutivo y Evolución anual). Explica en una frase por qué el
 * análisis se lee mejor en participación que en unidades absolutas.
 */
export function MarketContextNote({
  declinePct,
  ytd,
}: {
  declinePct: number;
  ytd?: { varPct: number | null; u2025: number; u2026: number; meses: string };
}) {
  return (
    <div className="glass rounded-2xl border-l-4 border-l-amber-400/80 px-4 py-3 text-sm text-slate-700">
      <span className="font-semibold text-amber-700">Contexto de mercado.</span>{" "}
      La cadena vendió {formatPct(Math.abs(declinePct))} menos unidades en 2025
      que en 2023, así que el crecimiento se lee mejor en{" "}
      <span className="font-medium">participación (% del año)</span> que en
      volumen absoluto.
      {ytd?.varPct != null && (
        <>
          {" "}
          Lo más reciente ({ytd.meses} 2026 vs. 2025):{" "}
          <span className="font-semibold tabular-nums">
            {formatPct(ytd.varPct)}
          </span>{" "}
          ({formatUnits(ytd.u2026)} vs {formatUnits(ytd.u2025)} u.).
        </>
      )}
    </div>
  );
}
