"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export const SECTIONS = [
  { id: "resumen", label: "Resumen ejecutivo" },
  { id: "consolidado", label: "Consolidado cadena" },
  { id: "por-local", label: "Por local" },
  { id: "comparacion", label: "Comparación" },
  { id: "evolucion", label: "Evolución anual" },
  { id: "evolucion-mensual", label: "Evolución mensual" },
  { id: "estacionalidad", label: "Estacionalidad" },
  { id: "recomendaciones", label: "Recomendaciones" },
  { id: "calidad", label: "Calidad de datos" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

export function Nav({
  active,
  onSelect,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  const activeIdx = SECTIONS.findIndex((s) => s.id === active);

  useLayoutEffect(() => {
    const el = btnRefs.current[active];
    const parent = containerRef.current;
    if (el && parent) {
      setPill({ left: el.offsetLeft, width: el.offsetWidth });
      // Mantener visible la pestaña activa al navegar en móvil.
      el.scrollIntoView({ inline: "nearest", block: "nearest" });
    }
  }, [active]);

  // Recalcular en resize (fuentes/wrap pueden cambiar posiciones).
  useEffect(() => {
    function onResize() {
      const el = btnRefs.current[active];
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active]);

  return (
    <nav
      ref={containerRef}
      className="relative flex gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {pill && (
        <span
          className="pointer-events-none absolute top-2 bottom-2 rounded-full bg-white/80 shadow-sm ring-1 ring-white/60 transition-all duration-300 ease-out"
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {SECTIONS.map((s, i) => (
        <button
          key={s.id}
          ref={(el) => {
            btnRefs.current[s.id] = el;
          }}
          onClick={() => onSelect(s.id)}
          className={`relative z-10 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            i === activeIdx
              ? "text-[var(--color-accent)]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {s.label}
        </button>
      ))}
    </nav>
  );
}
