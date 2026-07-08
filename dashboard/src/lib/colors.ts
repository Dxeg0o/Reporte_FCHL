// Color fijo y determinístico por temática, para que una misma temática se
// identifique visualmente igual sin importar en qué local, orden o sección
// aparezca (pedido explícito: comparar "por local" cambiando de sucursal).
//
// Se asigna por RANKING global (insights.macroChain / insights.chain), no por
// hash del texto: así las ~41 macro-temáticas quedan con hue completamente
// distinto entre sí (ángulo dorado ≈137.5°, sin colisiones hasta cientos de
// items). Un hash puro con paleta chica (ej. 20 colores) generaba colisiones
// reales entre temáticas que sí coexistían en el top de un mismo local.
import insightsData from "@/data/insights.json";
import type { Insights } from "@/types";

const insights = insightsData as Insights;

function hslColor(index: number): string {
  const hue = (index * 137.508) % 360;
  const light = index % 2 === 0 ? 46 : 58;
  return `hsl(${hue.toFixed(1)}deg 68% ${light}%)`;
}

function buildIndex(order: string[]): Map<string, string> {
  const map = new Map<string, string>();
  order.forEach((tema, i) => {
    if (!map.has(tema)) map.set(tema, hslColor(i));
  });
  return map;
}

const macroIndex = buildIndex(insights.macroChain.map((r) => r.tema));
const detailIndex = buildIndex(insights.chain.map((r) => r.tema));

function fallbackColor(tema: string): string {
  let hash = 0;
  for (let i = 0; i < tema.length; i++) {
    hash = (hash * 31 + tema.charCodeAt(i)) | 0;
  }
  return hslColor(Math.abs(hash));
}

export function colorForTema(tema: string): string {
  return macroIndex.get(tema) ?? detailIndex.get(tema) ?? fallbackColor(tema);
}
