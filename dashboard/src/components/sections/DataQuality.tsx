import { formatUnits } from "@/lib/format";
import type { Metadata } from "@/types";

export function DataQuality({ metadata }: { metadata: Metadata }) {
  const topExclusions = metadata.exclusionByCategory.slice(0, 15);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Observaciones de calidad de datos
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Criterios y supuestos aplicados durante la limpieza y consolidación de
          la base de ventas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-500">Registros crudos</p>
          <p className="mt-1 text-lg font-semibold">{formatUnits(metadata.rawRows)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-500">Excluidos (no-libro)</p>
          <p className="mt-1 text-lg font-semibold">{formatUnits(metadata.excludedRows)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-500">Registros de libros</p>
          <p className="mt-1 text-lg font-semibold">{formatUnits(metadata.bookRows)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-500">Sin temática identificada</p>
          <p className="mt-1 text-lg font-semibold">{formatUnits(metadata.sinTematicaCount)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Criterios de exclusión aplicados</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          {metadata.exclusionCriteria.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">
          Registros excluidos por categoría (top 15)
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">Categoría</th>
                <th className="py-2 pr-4 text-right">Registros</th>
                <th className="py-2 text-right">Unidades</th>
              </tr>
            </thead>
            <tbody>
              {topExclusions.map((e) => (
                <tr key={e.categoria} className="border-b border-slate-100">
                  <td className="py-1.5 pr-4">{e.categoria}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">
                    {formatUnits(e.registros)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {formatUnits(e.unidades)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Otras verificaciones</h3>
        <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
          <li>
            Cantidades o montos negativos (anulaciones/devoluciones):{" "}
            {metadata.negativeOrZeroFound ? "se encontraron y fueron tratadas" : "no se encontraron registros negativos en el archivo fuente"}.
          </li>
          <li>
            Categoría vacía en el archivo fuente:{" "}
            {metadata.emptyCategoryFound ? "sí, se encontraron casos" : "no se encontraron casos"}.
          </li>
          <li>
            Fusiones de categorías por normalización de mayúsculas/tildes:{" "}
            {Object.keys(metadata.categoryMerges).length} (
            {Object.entries(metadata.categoryMerges)
              .map(([a, b]) => `"${a}" → "${b}"`)
              .join(", ")}
            ).
          </li>
          <li>Locales identificados en el archivo fuente: {metadata.locales.length} (10 sucursales físicas, Tienda Web y CDD ENEA como canales separados). No se encontraron locales sin identificación clara.</li>
        </ul>
      </div>
    </div>
  );
}
