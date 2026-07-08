"use client";

export const SECTIONS = [
  { id: "resumen", label: "Resumen ejecutivo" },
  { id: "consolidado", label: "Consolidado cadena" },
  { id: "por-local", label: "Por local" },
  { id: "comparacion", label: "Comparación" },
  { id: "evolucion", label: "Evolución anual" },
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
  return (
    <nav className="flex gap-1 overflow-x-auto px-4">
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition ${
            active === s.id
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          {s.label}
        </button>
      ))}
    </nav>
  );
}
