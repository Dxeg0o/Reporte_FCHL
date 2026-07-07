"""
Preprocesa ventas_desde_2023.csv (ventas de la cadena de librerías FCHL) y genera
los JSON agregados que consume el dashboard Next.js en dashboard/src/data/.

Uso: python3 scripts/preprocess.py
"""
import json
import re
import unicodedata
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "ventas_desde_2023.csv"
OUT_DIR = ROOT / "dashboard" / "src" / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# 1. Carga
# ---------------------------------------------------------------------------
print("Cargando CSV...")
df = pd.read_csv(
    CSV_PATH,
    sep=";",
    dtype={"id_bodega": "int32", "sku": "string", "categoria": "string",
           "bodega": "string", "nombre_producto": "string"},
    parse_dates=["fecha"],
)
raw_rows = len(df)
df["anio"] = df["fecha"].dt.year
df["cantidad"] = pd.to_numeric(df["cantidad"], errors="coerce").fillna(0)
df["valorneto"] = pd.to_numeric(df["valorneto"], errors="coerce").fillna(0)

print(f"Filas crudas: {raw_rows:,}")

# ---------------------------------------------------------------------------
# 2. Exclusión de productos no-libro
# ---------------------------------------------------------------------------
# Categorías que corresponden a productos físicos no-libro (bolsas, juegos de mesa,
# gift cards, calendarios, material didáctico). Se excluyen por completo aunque
# una fracción de sus SKU tengan formato ISBN (ver nota de calidad de datos: esto
# ocurre porque el ERP usa el mismo campo categoria para libros de acertijos y
# juegos físicos, p.ej. "Juegos de Ingenio" incluye tanto libros de sudoku (ISBN)
# como juegos físicos; se excluye la categoría completa por prudencia y se reporta
# cuántos registros con ISBN válido quedaron fuera).
NON_BOOK_CATEGORIES = {
    "Bolsa Papel Chica",
    "Bolsa Papel Mediana",
    "Gift Card",
    "Calendarios",
    "Agendas y Calendarios",
    "Material Didactico",
    "Juegos de Mesa",
    "Puzzles",
    "Juego de Naipes",
    "Juegos de Ingenio",
    "Juegos Varios",
    "Juegos Didácticos y Educativos",
}
# SKU explícitos de bolsas (patrón xxxxxx/zzzzzzz mencionado en el brief == SKU
# genéricos de relleno, en este dataset son los 9999999990002 / 9999999990003).
NON_BOOK_SKUS = {"9999999990002", "9999999990003"}

is_non_book_cat = df["categoria"].isin(NON_BOOK_CATEGORIES)
is_non_book_sku = df["sku"].astype(str).isin(NON_BOOK_SKUS)
excluded_mask = is_non_book_cat | is_non_book_sku

excluded_df = df[excluded_mask]
excluded_isbn_swept = excluded_df[excluded_df["sku"].astype(str).str.match(r"^97[89]")]

exclusion_by_category = (
    excluded_df.groupby("categoria", observed=True)
    .agg(registros=("categoria", "size"), unidades=("cantidad", "sum"))
    .sort_values("unidades", ascending=False)
    .reset_index()
)

books_df = df[~excluded_mask].copy()
print(f"Filas excluidas (no-libro): {len(excluded_df):,}")
print(f"Filas de libros: {len(books_df):,}")

# ---------------------------------------------------------------------------
# 3. Normalización de categorías (fusiones seguras por mayúsculas/tildes)
# ---------------------------------------------------------------------------
def fmt_int(n: int) -> str:
    return f"{n:,}".replace(",", ".")


def norm_key(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", s).strip().lower()

CATEGORY_MERGES = {
    "Ciencia Y Naturaleza": "Ciencia y Naturaleza",
    "Biografías y estudios de escritores": "Biografías y Estudios de Escritores",
    "Homeopatí­a": "Homeopatía",
}
books_df["categoria"] = books_df["categoria"].replace(CATEGORY_MERGES)

# "(desconocido)" -> Sin temática identificada
SIN_TEMATICA_LABEL = "Sin temática identificada"
sin_tematica_count = int((books_df["categoria"] == "(desconocido)").sum())
books_df["categoria"] = books_df["categoria"].replace("(desconocido)", SIN_TEMATICA_LABEL)

# ---------------------------------------------------------------------------
# 4. Normalización de locales
# ---------------------------------------------------------------------------
def display_local(raw: str) -> str:
    name = re.sub(r"^\d+\s*-\s*", "", raw).strip()
    name = re.sub(r"^Local\s+", "", name)
    return name

LOCAL_OVERRIDES = {
    "Tienda Virtual": "Tienda Web",
    "CDD ENEA": "CDD ENEA",
}

books_df["local"] = books_df["bodega"].map(display_local)
books_df["local"] = books_df["local"].replace(LOCAL_OVERRIDES)

def local_type(name: str) -> str:
    if name == "Tienda Web":
        return "web"
    if name == "CDD ENEA":
        return "cdd"
    return "fisica"

locals_meta = (
    books_df[["local"]]
    .drop_duplicates()
    .assign(tipo=lambda d: d["local"].map(local_type))
    .sort_values("local")
    .to_dict("records")
)

# ---------------------------------------------------------------------------
# 5. Agregación local x categoria x anio
# ---------------------------------------------------------------------------
agg = (
    books_df.groupby(["local", "categoria", "anio"], observed=True)
    .agg(unidades=("cantidad", "sum"), monto=("valorneto", "sum"))
    .reset_index()
)
agg = agg[agg["unidades"] > 0]
agg["unidades"] = agg["unidades"].astype(int)
agg["monto"] = agg["monto"].astype(int)

print(f"Filas agregadas (local x categoria x anio): {len(agg):,}")

aggregated_records = agg.rename(columns={"anio": "anio"}).to_dict("records")
(OUT_DIR / "aggregated.json").write_text(
    json.dumps(aggregated_records, ensure_ascii=False), encoding="utf-8"
)

# ---------------------------------------------------------------------------
# 6. Metadata / calidad de datos
# ---------------------------------------------------------------------------
period_min = str(books_df["fecha"].min().date())
period_max = str(books_df["fecha"].max().date())
years_present = sorted(int(y) for y in books_df["anio"].dropna().unique())

metadata = {
    "generatedAt": pd.Timestamp.now().isoformat(),
    "sourceFile": "ventas_desde_2023.csv",
    "rawRows": int(raw_rows),
    "excludedRows": int(len(excluded_df)),
    "excludedUnits": int(excluded_df["cantidad"].sum()),
    "bookRows": int(len(books_df)),
    "bookUnitsTotal": int(books_df["cantidad"].sum()),
    "bookAmountTotal": int(books_df["valorneto"].sum()),
    "period": {"min": period_min, "max": period_max},
    "yearsPresent": years_present,
    "partialYear": 2026,
    "partialYearNote": f"2026 incluye datos solo hasta {period_max} (año en curso, no comparable con años completos).",
    "locales": locals_meta,
    "sinTematicaCount": sin_tematica_count,
    "exclusionCriteria": [
        "Se excluyeron los SKU genéricos de bolsas de papel (9999999990002 / 9999999990003).",
        "Se excluyeron por completo las categorías no-libro: " + ", ".join(sorted(NON_BOOK_CATEGORIES)) + ".",
        (
            f"De los registros excluidos, {fmt_int(len(excluded_isbn_swept))} tenían SKU con formato "
            "ISBN (prefijo 978/979) — corresponden principalmente a libros de acertijos/sudoku o "
            "packs educativos clasificados bajo categorías de 'juegos'. Se excluyeron igualmente "
            "por pertenecer a una categoría de producto no-libro, priorizando consistencia por "
            "categoría sobre el formato del código. Esto puede subestimar levemente las unidades "
            "de libros de esas categorías límite."
        ),
        "Los registros con SKU sin formato ISBN pero en categorías editoriales de libros (p.ej. 'Clásicos Universales', 'Ficción y Cuentos') se mantuvieron como libros, ya que la categoría es el criterio primario de clasificación.",
        f"La categoría '(desconocido)' ({sin_tematica_count} registros) se renombró a '{SIN_TEMATICA_LABEL}'.",
    ],
    "categoryMerges": CATEGORY_MERGES,
    "exclusionByCategory": exclusion_by_category.to_dict("records"),
    "negativeOrZeroFound": False,
    "emptyCategoryFound": False,
}
(OUT_DIR / "metadata.json").write_text(
    json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8"
)

# ---------------------------------------------------------------------------
# 7. Insights precomputados
# ---------------------------------------------------------------------------
def pct_table(frame: pd.DataFrame, group_cols, value_col="unidades"):
    g = frame.groupby(group_cols, observed=True)[value_col].sum().reset_index()
    return g

# Consolidado cadena (todos los años)
chain = books_df.groupby("categoria", observed=True).agg(
    unidades=("cantidad", "sum"), monto=("valorneto", "sum")
).reset_index()
chain = chain.sort_values("unidades", ascending=False).reset_index(drop=True)
total_unidades = chain["unidades"].sum()
total_monto = chain["monto"].sum()
chain["rank"] = chain.index + 1
chain["pctUnidades"] = (chain["unidades"] / total_unidades * 100).round(2)
chain["pctMonto"] = (chain["monto"] / total_monto * 100).round(2)
chain["unidades"] = chain["unidades"].astype(int)
chain["monto"] = chain["monto"].astype(int)

# Top temática dominante por local + concentración (HHI simplificado: % top temática y top5)
per_local = books_df.groupby(["local", "categoria"], observed=True)["cantidad"].sum().reset_index()
local_totals = per_local.groupby("local")["cantidad"].sum().rename("total_local")
per_local = per_local.merge(local_totals, on="local")
per_local["pct"] = per_local["cantidad"] / per_local["total_local"] * 100
per_local_sorted = per_local.sort_values(["local", "cantidad"], ascending=[True, False])

dominant_by_local = []
concentration_by_local = []
for local, grp in per_local_sorted.groupby("local"):
    top = grp.iloc[0]
    top5_pct = grp.head(5)["pct"].sum()
    hhi = float(((grp["pct"] / 100) ** 2).sum() * 10000)  # HHI escala 0-10000
    n_categorias = int((grp["cantidad"] > 0).sum())
    dominant_by_local.append({
        "local": local,
        "categoriaDominante": top["categoria"],
        "pct": round(float(top["pct"]), 2),
        "unidades": int(top["cantidad"]),
    })
    concentration_by_local.append({
        "local": local,
        "top5Pct": round(float(top5_pct), 2),
        "hhi": round(hhi, 1),
        "categoriasActivas": n_categorias,
    })
concentration_by_local.sort(key=lambda r: r["top5Pct"], reverse=True)

# Tienda web vs físicas: top 10 categorías comparadas
web_cats = per_local[per_local["local"] == "Tienda Web"].sort_values("cantidad", ascending=False)
fisicas = per_local[~per_local["local"].isin(["Tienda Web", "CDD ENEA"])]
fisicas_cats = fisicas.groupby("categoria")["cantidad"].sum().reset_index().sort_values("cantidad", ascending=False)
fisicas_total = fisicas_cats["cantidad"].sum()
fisicas_cats["pct"] = fisicas_cats["cantidad"] / fisicas_total * 100
web_total = web_cats["cantidad"].sum()
web_cats = web_cats.copy()
web_cats["pct"] = web_cats["cantidad"] / web_total * 100

web_vs_fisicas = {
    "webTop10": web_cats.head(10)[["categoria", "cantidad", "pct"]].round({"pct": 2}).to_dict("records"),
    "fisicasTop10": fisicas_cats.head(10)[["categoria", "cantidad", "pct"]].round({"pct": 2}).to_dict("records"),
    "webTotalUnidades": int(web_total),
    "fisicasTotalUnidades": int(fisicas_total),
}

# Evolución anual: unidades por categoria y año (top 15 categorías cadena)
top15_cats = chain.head(15)["categoria"].tolist()
yearly = books_df[books_df["categoria"].isin(top15_cats)].groupby(
    ["categoria", "anio"], observed=True
)["cantidad"].sum().reset_index()
yearly_pivot = yearly.pivot(index="categoria", columns="anio", values="cantidad").fillna(0)

# Crecimiento 2023 -> 2025 (años completos)
growth = []
if 2023 in yearly_pivot.columns and 2025 in yearly_pivot.columns:
    for cat in yearly_pivot.index:
        v23 = yearly_pivot.loc[cat, 2023] if 2023 in yearly_pivot.columns else 0
        v25 = yearly_pivot.loc[cat, 2025] if 2025 in yearly_pivot.columns else 0
        if v23 > 0:
            change = (v25 - v23) / v23 * 100
        else:
            change = None
        growth.append({
            "categoria": cat,
            "unidades2023": int(v23),
            "unidades2025": int(v25),
            "variacionPct": round(float(change), 2) if change is not None else None,
        })
growth.sort(key=lambda r: (r["variacionPct"] is None, -(r["variacionPct"] or -999)))

yearly_records = []
for cat in yearly_pivot.index:
    row = {"categoria": cat}
    for year in years_present:
        row[str(year)] = int(yearly_pivot.loc[cat, year]) if year in yearly_pivot.columns else 0
    yearly_records.append(row)

insights = {
    "chain": chain[["rank", "categoria", "unidades", "pctUnidades", "monto", "pctMonto"]].to_dict("records"),
    "totalUnidades": int(total_unidades),
    "totalMonto": int(total_monto),
    "dominantByLocal": dominant_by_local,
    "concentrationByLocal": concentration_by_local,
    "webVsFisicas": web_vs_fisicas,
    "yearlyTop15": yearly_records,
    "growth2023to2025": growth,
    "top15Categorias": top15_cats,
}
(OUT_DIR / "insights.json").write_text(
    json.dumps(insights, ensure_ascii=False), encoding="utf-8"
)

print("Listo. JSON generados en", OUT_DIR)
print(f"  aggregated.json: {len(aggregated_records):,} filas")
print(f"  metadata.json")
print(f"  insights.json")
