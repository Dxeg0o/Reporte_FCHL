"use client";

import type { Vista } from "@/types";

export function VistaToggle({
  vista,
  onChange,
}: {
  vista: Vista;
  onChange: (v: Vista) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
      <span className="px-2 text-slate-400">Vista:</span>
      {(["macro", "detalle"] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`rounded-md px-2.5 py-1 font-medium transition ${
            vista === v
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {v === "macro" ? "Macro-temáticas" : "Detalle (565)"}
        </button>
      ))}
    </div>
  );
}
