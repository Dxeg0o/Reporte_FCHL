import type { Recommendation } from "@/lib/recommendations";

const BADGE_STYLES: Record<Recommendation["categoria"], string> = {
  Compra: "bg-emerald-100 text-emerald-800",
  Reposición: "bg-red-100 text-red-800",
  Surtido: "bg-blue-100 text-blue-800",
  Redistribución: "bg-purple-100 text-purple-800",
};

export function Recommendations({ recs }: { recs: Recommendation[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Recomendaciones comerciales para adquisiciones
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Generadas automáticamente a partir de los datos consolidados. Cada
          recomendación indica el dato en el que se basa.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {recs.map((r, i) => (
          <div
            key={i}
            className="glass glass-hover animate-fade-in-up p-5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_STYLES[r.categoria]}`}
            >
              {r.categoria}
            </span>
            <h3 className="mt-2 text-sm font-semibold text-slate-900">
              {r.titulo}
            </h3>
            <p className="mt-1.5 text-sm text-slate-600">{r.detalle}</p>
            <p className="mt-2 text-xs text-slate-400">Base: {r.base}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
