import type { Insights, LocalMeta } from "@/types";
import { formatPct, formatUnits } from "./format";

export interface Recommendation {
  categoria: "Reposición" | "Surtido" | "Redistribución" | "Compra";
  titulo: string;
  detalle: string;
  base: string;
}

export function buildRecommendations(
  insights: Insights,
  locales: LocalMeta[]
): Recommendation[] {
  const recs: Recommendation[] = [];
  const fisicas = locales.filter((l) => l.tipo === "fisica").map((l) => l.local);

  // 1. Locales muy concentrados en pocas macro-temáticas -> reforzar stock líder, diversificar el resto
  const highConcentration = insights.concentrationByLocal
    .filter((c) => c.top5Pct >= 45 && fisicas.includes(c.local))
    .slice(0, 4);
  for (const c of highConcentration) {
    const dom = insights.dominantByLocal.find((d) => d.local === c.local);
    if (!dom) continue;
    recs.push({
      categoria: "Surtido",
      titulo: `${c.local}: alta concentración en pocas macro-temáticas`,
      detalle: `El top 5 de macro-temáticas explica ${formatPct(c.top5Pct)} de las unidades vendidas del local, con "${dom.categoriaDominante}" a la cabeza (${formatPct(dom.pct)}). Mantener stock robusto de esa temática, pero evaluar ampliar el surtido en temáticas secundarias para reducir dependencia.`,
      base: `Índice de concentración top-5 = ${formatPct(c.top5Pct)}; HHI = ${c.hhi}.`,
    });
  }

  // 2. Locales muy diversificados -> catálogo amplio, oportunidad de curar mejor el surtido de cabecera
  const lowConcentration = insights.concentrationByLocal
    .filter((c) => c.top5Pct <= 22 && fisicas.includes(c.local))
    .slice(0, 3);
  for (const c of lowConcentration) {
    recs.push({
      categoria: "Surtido",
      titulo: `${c.local}: ventas muy diversificadas`,
      detalle: `Ninguna macro-temática domina claramente (top 5 solo concentra ${formatPct(c.top5Pct)} de las unidades, con ${c.categoriasActivas} temáticas de detalle activas). Conviene revisar si el surtido de cabecera está bien definido o si conviene reforzar 2-3 temáticas ancla.`,
      base: `Índice de concentración top-5 = ${formatPct(c.top5Pct)} sobre ${c.categoriasActivas} temáticas de detalle.`,
    });
  }

  // 3. Macro-temáticas que ganan participación 2023->2025 -> aumentar compra
  // (se prioriza el delta de participación sobre unidades absolutas porque el
  // mercado completo cayó ~27% en el período: casi todo cae en volumen).
  const growing = insights.growthMacro
    .filter((g) => g.deltaShare >= 1)
    .slice(0, 4);
  for (const g of growing) {
    recs.push({
      categoria: "Compra",
      titulo: `"${g.tema}" gana participación`,
      detalle: `Su participación sobre el total de la cadena subió ${g.deltaShare.toFixed(1)} puntos entre 2023 (${formatPct(g.share2023)}) y 2025 (${formatPct(g.share2025)}, año completo), pese a la caída general del mercado. Priorizar en las próximas compras/reposiciones.`,
      base: `Participación 2023→2025: ${formatPct(g.share2023)} → ${formatPct(g.share2025)} (+${g.deltaShare.toFixed(1)} pts).`,
    });
  }

  // 4. Macro-temáticas que pierden participación sostenidamente -> reducir reposición
  const declining = insights.growthMacro
    .filter((g) => g.deltaShare <= -1)
    .slice(0, 4);
  for (const g of declining) {
    recs.push({
      categoria: "Reposición",
      titulo: `"${g.tema}" pierde participación`,
      detalle: `Su participación sobre el total de la cadena bajó ${Math.abs(g.deltaShare).toFixed(1)} puntos entre 2023 (${formatPct(g.share2023)}) y 2025 (${formatPct(g.share2025)}, año completo). Reducir volumen de reposición y evitar sobre-stock.`,
      base: `Participación 2023→2025: ${formatPct(g.share2023)} → ${formatPct(g.share2025)} (${g.deltaShare.toFixed(1)} pts).`,
    });
  }

  // 5. Señal de corto plazo: caída fuerte YTD (ene-jun 2026 vs 2025) por macro-temática
  const ytdDeclining = insights.ytd.byMacro
    .filter((y) => y.varPct !== null && y.varPct <= -15 && y.u2025 >= 2000)
    .slice(0, 3);
  for (const y of ytdDeclining) {
    recs.push({
      categoria: "Reposición",
      titulo: `"${y.nombre}" cae fuerte en lo que va de 2026`,
      detalle: `${insights.ytd.meses} 2026 muestra ${formatUnits(y.u2026)} unidades vs. ${formatUnits(y.u2025)} en el mismo período de 2025 (${formatPct(y.varPct ?? 0)}). Es una señal de corto plazo, más reciente que la tendencia 2023-2025: ajustar reposición ahora, no solo con la foto anual.`,
      base: `${insights.ytd.meses} 2026 vs 2025: ${formatUnits(y.u2026)} vs ${formatUnits(y.u2025)} u. (${formatPct(y.varPct ?? 0)}).`,
    });
  }

  // 6. Macro-temáticas fuertes en Tienda Web pero ausentes del top físico -> candidatas a expandir en local
  const fisicasSet = new Set(insights.webVsFisicas.fisicasTop10.map((c) => c.categoria));
  const webOnly = insights.webVsFisicas.webTop10.filter((c) => !fisicasSet.has(c.categoria)).slice(0, 3);
  for (const c of webOnly) {
    recs.push({
      categoria: "Redistribución",
      titulo: `"${c.categoria}" fuerte en Tienda Web, ausente del top físico`,
      detalle: `Representa ${formatPct(c.pct)} de las unidades de la Tienda Web pero no aparece en el top 10 de macro-temáticas de las sucursales físicas. Evaluar si conviene dar mayor visibilidad/stock a esta temática en tiendas físicas seleccionadas.`,
      base: `${formatPct(c.pct)} de unidades de Tienda Web (${formatUnits(c.cantidad)} u.).`,
    });
  }

  // 7. Redistribución: temáticas de baja rotación por local, ya precalculadas en preprocess.py
  // (rotan bien en la cadena pero muy por debajo de su participación esperada en el local).
  const seenLocals = new Set<string>();
  for (const w of insights.weakByLocal) {
    if (seenLocals.has(w.local)) continue;
    if (w.gap < 2) continue;
    seenLocals.add(w.local);
    recs.push({
      categoria: "Redistribución",
      titulo: `"${w.macro}" rota bien en la cadena, poco en ${w.local}`,
      detalle: `A nivel cadena representa ${formatPct(w.chainPct)} de las unidades, pero en ${w.local} solo ${formatPct(w.localPct)} (brecha de ${formatPct(w.gap)}). Revisar si conviene ajustar el surtido/stock inicial en ${w.local} o si es una diferencia de perfil de cliente esperable.`,
      base: `${w.local}: ${formatPct(w.localPct)} vs. cadena: ${formatPct(w.chainPct)} (brecha ${formatPct(w.gap)}).`,
    });
    if (recs.filter((r) => r.categoria === "Redistribución").length >= 8) break;
  }

  return recs;
}
