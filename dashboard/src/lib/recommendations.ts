import type { AggregatedRow, Insights, LocalMeta } from "@/types";
import { byLocal } from "./aggregate";
import { formatPct, formatUnits } from "./format";

export interface Recommendation {
  categoria: "Reposición" | "Surtido" | "Redistribución" | "Compra";
  titulo: string;
  detalle: string;
  base: string;
}

export function buildRecommendations(
  aggregated: AggregatedRow[],
  insights: Insights,
  locales: LocalMeta[]
): Recommendation[] {
  const recs: Recommendation[] = [];
  const fisicas = locales.filter((l) => l.tipo === "fisica").map((l) => l.local);

  // 1. Locales muy concentrados en una sola temática -> riesgo, reforzar stock pero diversificar
  const highConcentration = insights.concentrationByLocal
    .filter((c) => c.top5Pct >= 45 && fisicas.includes(c.local))
    .slice(0, 4);
  for (const c of highConcentration) {
    const dom = insights.dominantByLocal.find((d) => d.local === c.local);
    if (!dom) continue;
    recs.push({
      categoria: "Surtido",
      titulo: `${c.local}: alta concentración en pocas temáticas`,
      detalle: `El top 5 de temáticas explica ${formatPct(c.top5Pct)} de las unidades vendidas del local, con "${dom.categoriaDominante}" a la cabeza (${formatPct(dom.pct)}). Mantener stock robusto de esa temática, pero evaluar ampliar el surtido en temáticas secundarias para reducir dependencia.`,
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
      detalle: `Ninguna temática domina claramente (top 5 solo concentra ${formatPct(c.top5Pct)} de las unidades, con ${c.categoriasActivas} temáticas activas). Conviene revisar si el surtido de cabecera está bien definido o si conviene reforzar 2-3 temáticas ancla.`,
      base: `Índice de concentración top-5 = ${formatPct(c.top5Pct)} sobre ${c.categoriasActivas} temáticas activas.`,
    });
  }

  // 3. Temáticas en crecimiento sostenido 2023->2025 -> aumentar compra
  const growing = insights.growth2023to2025
    .filter((g) => g.variacionPct !== null && g.variacionPct >= 10)
    .slice(0, 4);
  for (const g of growing) {
    recs.push({
      categoria: "Compra",
      titulo: `"${g.categoria}" en crecimiento`,
      detalle: `Las unidades vendidas de esta temática crecieron ${formatPct(g.variacionPct ?? 0)} entre 2023 (${formatUnits(g.unidades2023)} u.) y 2025 (${formatUnits(g.unidades2025)} u., año completo). Priorizar en las próximas compras/reposiciones.`,
      base: `Variación 2023→2025: ${formatUnits(g.unidades2023)} → ${formatUnits(g.unidades2025)} unidades (${formatPct(g.variacionPct ?? 0)}).`,
    });
  }

  // 4. Temáticas en caída sostenida -> reducir reposición
  const declining = insights.growth2023to2025
    .filter((g) => g.variacionPct !== null && g.variacionPct <= -10)
    .slice(0, 4);
  for (const g of declining) {
    recs.push({
      categoria: "Reposición",
      titulo: `"${g.categoria}" en caída`,
      detalle: `Las unidades vendidas cayeron ${formatPct(g.variacionPct ?? 0)} entre 2023 (${formatUnits(g.unidades2023)} u.) y 2025 (${formatUnits(g.unidades2025)} u., año completo). Reducir volumen de reposición y evitar sobre-stock.`,
      base: `Variación 2023→2025: ${formatUnits(g.unidades2023)} → ${formatUnits(g.unidades2025)} unidades (${formatPct(g.variacionPct ?? 0)}).`,
    });
  }

  // 5. Temáticas fuertes en Tienda Web pero débiles en tiendas físicas -> candidatas a expandir en local
  const fisicasSet = new Set(insights.webVsFisicas.fisicasTop10.map((c) => c.categoria));
  const webOnly = insights.webVsFisicas.webTop10.filter((c) => !fisicasSet.has(c.categoria)).slice(0, 3);
  for (const c of webOnly) {
    recs.push({
      categoria: "Redistribución",
      titulo: `"${c.categoria}" fuerte en Tienda Web, ausente del top físico`,
      detalle: `Representa ${formatPct(c.pct)} de las unidades de la Tienda Web pero no aparece en el top 10 de temáticas de las sucursales físicas. Evaluar si conviene dar mayor visibilidad/stock a esta temática en tiendas físicas seleccionadas.`,
      base: `${formatPct(c.pct)} de unidades de Tienda Web (${formatUnits(c.cantidad)} u.).`,
    });
  }

  // 6. Categoría dominante de un local con venta marginal en otro local similar -> redistribuir stock
  const domByLocal = new Map(insights.dominantByLocal.map((d) => [d.local, d]));
  for (const local of fisicas) {
    const dom = domByLocal.get(local);
    if (!dom) continue;
    const rows = byLocal(aggregated, local);
    const share = rows.find((r) => r.categoria === dom.categoriaDominante);
    if (!share || share.pctUnidades < 6) continue;
    // buscar otro local físico donde esta misma categoría tenga participación baja
    for (const other of fisicas) {
      if (other === local) continue;
      const otherRows = byLocal(aggregated, other);
      const otherShare = otherRows.find((r) => r.categoria === dom.categoriaDominante);
      const otherPct = otherShare?.pctUnidades ?? 0;
      if (otherPct > 0 && otherPct < share.pctUnidades / 3) {
        recs.push({
          categoria: "Redistribución",
          titulo: `"${dom.categoriaDominante}" fuerte en ${local}, marginal en ${other}`,
          detalle: `En ${local} representa ${formatPct(share.pctUnidades)} de las unidades del local; en ${other} solo ${formatPct(otherPct)}. Revisar si conviene ajustar el surtido/stock inicial en ${other} o si es una diferencia de perfil de cliente esperable.`,
          base: `${local}: ${formatPct(share.pctUnidades)} vs. ${other}: ${formatPct(otherPct)} sobre unidades del local.`,
        });
        break;
      }
    }
    if (recs.filter((r) => r.categoria === "Redistribución").length >= 6) break;
  }

  return recs;
}
