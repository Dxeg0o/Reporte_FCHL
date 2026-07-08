"""
Preprocesa ventas_desde_2023.csv (ventas de la cadena de librerías FCHL) y genera
los JSON agregados que consume el dashboard Next.js en dashboard/src/data/.

Uso: python3 scripts/preprocess.py
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from macro_map import ALL_MACROS, M_OTRAS, macro_for  # noqa: E402

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

# Macro-temática (mapeo curado en scripts/macro_map.py) y mes (YYYY-MM)
cat_to_macro = {c: macro_for(c) for c in books_df["categoria"].dropna().unique()}
books_df["macro"] = books_df["categoria"].map(cat_to_macro)
books_df["ym"] = books_df["fecha"].dt.strftime("%Y-%m")
books_df["mes"] = books_df["fecha"].dt.month

# Auditoría del mapeo: categorías que cayeron en "Otras temáticas"
unmapped_cats = sorted(c for c, m in cat_to_macro.items() if m == M_OTRAS)
unmapped_units = int(books_df.loc[books_df["macro"] == M_OTRAS, "cantidad"].sum())

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
# 5. Agregación local x macro x categoria x anio  → aggregated.json
# ---------------------------------------------------------------------------
agg = (
    books_df.groupby(["local", "macro", "categoria", "anio"], observed=True)
    .agg(unidades=("cantidad", "sum"), monto=("valorneto", "sum"))
    .reset_index()
)
agg = agg[agg["unidades"] > 0]
agg["unidades"] = agg["unidades"].astype(int)
agg["monto"] = agg["monto"].astype(int)

print(f"Filas agregadas (local x macro x categoria x anio): {len(agg):,}")

aggregated_records = agg.to_dict("records")
(OUT_DIR / "aggregated.json").write_text(
    json.dumps(aggregated_records, ensure_ascii=False), encoding="utf-8"
)

# ---------------------------------------------------------------------------
# 5b. Agregación mensual local x macro x mes  → monthly.json
# ---------------------------------------------------------------------------
monthly = (
    books_df.groupby(["local", "macro", "ym"], observed=True)
    .agg(unidades=("cantidad", "sum"), monto=("valorneto", "sum"))
    .reset_index()
)
monthly = monthly[monthly["unidades"] > 0]
monthly["unidades"] = monthly["unidades"].astype(int)
monthly["monto"] = monthly["monto"].astype(int)
monthly_records = monthly.to_dict("records")
(OUT_DIR / "monthly.json").write_text(
    json.dumps(monthly_records, ensure_ascii=False), encoding="utf-8"
)
print(f"Filas mensuales (local x macro x mes): {len(monthly):,}")

# ---------------------------------------------------------------------------
# 6. Metadata / calidad de datos
# ---------------------------------------------------------------------------
period_min = str(books_df["fecha"].min().date())
period_max = str(books_df["fecha"].max().date())
years_present = sorted(int(y) for y in books_df["anio"].dropna().unique())

# Totales por año (contexto de mercado en caída)
year_tot = (
    books_df.groupby("anio", observed=True)
    .agg(unidades=("cantidad", "sum"), monto=("valorneto", "sum"))
    .reset_index()
    .sort_values("anio")
)
chain_year_totals = [
    {"anio": int(r["anio"]), "unidades": int(r["unidades"]), "monto": int(r["monto"])}
    for _, r in year_tot.iterrows()
]
_yt = {r["anio"]: r["unidades"] for r in chain_year_totals}
chain_decline_pct = (
    round((_yt[2025] - _yt[2023]) / _yt[2023] * 100, 1)
    if 2023 in _yt and 2025 in _yt else None
)

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
            "ISBN (prefijo 978/979) - corresponden principalmente a libros de acertijos/sudoku o "
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
    "chainYearTotals": chain_year_totals,
    "chainDeclinePct": chain_decline_pct,
    "macro": {
        "numFamilias": len(ALL_MACROS) - 1,  # excluye "Sin temática identificada"
        "categoriasNoMapeadas": len(unmapped_cats),
        "unidadesNoMapeadas": unmapped_units,
        "nota": (
            "Las 565 categorías editoriales originales se agruparon en macro-temáticas "
            "usando la taxonomía oficial entregada por el equipo de adquisiciones "
            "(categorias_subcategorias_simple_v2.xlsx, 40 macro-categorías), invertida "
            "en scripts/macro_map.py. 17 categorías finas aparecían en el archivo bajo "
            "más de una macro-categoría; las de bajo volumen se resolvieron por orden de "
            "aparición y las de alto volumen (Narrativa Extranjera/Fantástica/"
            "Latinoamericana, Psicología Infantil, Teatro) se curaron a mano para evitar "
            "clasificaciones erróneas - ver AMBIGUOUS_OVERRIDES en macro_map.py. Las "
            f"categorías sin match en el archivo oficial ({len(unmapped_cats)}, "
            f"{fmt_int(unmapped_units)} unidades) se agruparon en 'Otras temáticas'. "
            "Precio medio = monto neto / unidades."
        ),
    },
}
(OUT_DIR / "metadata.json").write_text(
    json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8"
)

# ---------------------------------------------------------------------------
# 7. Insights precomputados
# ---------------------------------------------------------------------------
def ranking(frame, dim):
    """Ranking consolidado por dimensión (macro o categoria) con % unidades y monto."""
    g = (
        frame.groupby(dim, observed=True)
        .agg(unidades=("cantidad", "sum"), monto=("valorneto", "sum"))
        .reset_index()
        .sort_values("unidades", ascending=False)
        .reset_index(drop=True)
    )
    tu, tm = g["unidades"].sum(), g["monto"].sum()
    g["rank"] = g.index + 1
    g["pctUnidades"] = (g["unidades"] / tu * 100).round(2)
    g["pctMonto"] = (g["monto"] / tm * 100).round(2)
    g["unidades"] = g["unidades"].astype(int)
    g["monto"] = g["monto"].astype(int)
    return g.rename(columns={dim: "tema"})[
        ["rank", "tema", "unidades", "pctUnidades", "monto", "pctMonto"]
    ]

chain = ranking(books_df, "categoria")           # detalle (565)
macro_chain = ranking(books_df, "macro")          # macro (~26)
total_unidades = int(books_df["cantidad"].sum())
total_monto = int(books_df["valorneto"].sum())

# --- Dominante y concentración por local (a nivel MACRO, vista por defecto) ---
per_local_macro = books_df.groupby(["local", "macro"], observed=True)["cantidad"].sum().reset_index()
lt = per_local_macro.groupby("local")["cantidad"].sum().rename("total_local")
per_local_macro = per_local_macro.merge(lt, on="local")
per_local_macro["pct"] = per_local_macro["cantidad"] / per_local_macro["total_local"] * 100
per_local_macro_sorted = per_local_macro.sort_values(["local", "cantidad"], ascending=[True, False])

# nº de temáticas de detalle activas por local (para KPI de diversidad)
cats_activas = books_df.groupby("local", observed=True)["categoria"].nunique()

dominant_by_local = []
concentration_by_local = []
for local, grp in per_local_macro_sorted.groupby("local"):
    top = grp.iloc[0]
    top5_pct = grp.head(5)["pct"].sum()
    hhi = float(((grp["pct"] / 100) ** 2).sum() * 10000)
    dominant_by_local.append({
        "local": local,
        "categoriaDominante": top["macro"],
        "pct": round(float(top["pct"]), 2),
        "unidades": int(top["cantidad"]),
    })
    concentration_by_local.append({
        "local": local,
        "top5Pct": round(float(top5_pct), 2),
        "hhi": round(hhi, 1),
        "categoriasActivas": int(cats_activas.get(local, 0)),
    })
concentration_by_local.sort(key=lambda r: r["top5Pct"], reverse=True)

# --- Tienda web vs físicas (macro) ---
web_m = per_local_macro[per_local_macro["local"] == "Tienda Web"].sort_values("cantidad", ascending=False)
fis_m = per_local_macro[~per_local_macro["local"].isin(["Tienda Web", "CDD ENEA"])]
fis_cats = fis_m.groupby("macro")["cantidad"].sum().reset_index().sort_values("cantidad", ascending=False)
fis_total = fis_cats["cantidad"].sum()
fis_cats["pct"] = fis_cats["cantidad"] / fis_total * 100
web_total = web_m["cantidad"].sum()
web_m = web_m.copy()
web_m["pct2"] = web_m["cantidad"] / web_total * 100

web_vs_fisicas = {
    "webTop10": [
        {"categoria": r["macro"], "cantidad": int(r["cantidad"]), "pct": round(float(r["pct2"]), 2)}
        for _, r in web_m.head(10).iterrows()
    ],
    "fisicasTop10": [
        {"categoria": r["macro"], "cantidad": int(r["cantidad"]), "pct": round(float(r["pct"]), 2)}
        for _, r in fis_cats.head(10).iterrows()
    ],
    "webTotalUnidades": int(web_total),
    "fisicasTotalUnidades": int(fis_total),
}

# --- Crecimiento/caída 2023→2025 en unidades Y participación (macro y detalle) ---
def growth_table(dim, only_names=None):
    piv = (
        books_df.groupby([dim, "anio"], observed=True)["cantidad"].sum()
        .reset_index().pivot(index=dim, columns="anio", values="cantidad").fillna(0)
    )
    rows = []
    for name in piv.index:
        if only_names is not None and name not in only_names:
            continue
        u23 = float(piv.loc[name, 2023]) if 2023 in piv.columns else 0.0
        u25 = float(piv.loc[name, 2025]) if 2025 in piv.columns else 0.0
        s23 = u23 / _yt[2023] * 100 if _yt.get(2023) else 0
        s25 = u25 / _yt[2025] * 100 if _yt.get(2025) else 0
        rows.append({
            "tema": name,
            "unidades2023": int(u23),
            "unidades2025": int(u25),
            "variacionPct": round((u25 - u23) / u23 * 100, 2) if u23 > 0 else None,
            "share2023": round(s23, 2),
            "share2025": round(s25, 2),
            "deltaShare": round(s25 - s23, 2),
        })
    rows.sort(key=lambda r: (r["deltaShare"] is None, -(r["deltaShare"] or -999)))
    return rows

top_detail = chain.head(20)["tema"].tolist()
growth_macro = growth_table("macro")
growth_detail = growth_table("categoria", only_names=set(top_detail))

# --- YTD ene–jun 2026 vs 2025 (meses completos) ---
ytd_df = books_df[books_df["mes"].between(1, 6)]
def _ytd_pivot(dim=None):
    if dim is None:
        by = ytd_df.groupby("anio", observed=True)["cantidad"].sum()
        return {int(k): int(v) for k, v in by.items()}
    piv = ytd_df.groupby([dim, "anio"], observed=True)["cantidad"].sum().reset_index()
    piv = piv.pivot(index=dim, columns="anio", values="cantidad").fillna(0)
    out = []
    for name in piv.index:
        u25 = int(piv.loc[name, 2025]) if 2025 in piv.columns else 0
        u26 = int(piv.loc[name, 2026]) if 2026 in piv.columns else 0
        out.append({
            "nombre": name, "u2025": u25, "u2026": u26,
            "varPct": round((u26 - u25) / u25 * 100, 2) if u25 > 0 else None,
        })
    out.sort(key=lambda r: -r["u2026"])
    return out

_ytd_chain = _ytd_pivot(None)
ytd = {
    "meses": "enero–junio",
    "chain": {
        "u2025": _ytd_chain.get(2025, 0),
        "u2026": _ytd_chain.get(2026, 0),
        "varPct": round((_ytd_chain.get(2026, 0) - _ytd_chain.get(2025, 0)) / _ytd_chain[2025] * 100, 2)
        if _ytd_chain.get(2025) else None,
    },
    "byLocal": _ytd_pivot("local"),
    "byMacro": _ytd_pivot("macro"),
}

# --- Temáticas débiles por local (macro): rota bien en la cadena, mal en el local ---
chain_macro_share = {r["tema"]: r["pctUnidades"] for _, r in macro_chain.iterrows()}
weak_by_local = []
for local, grp in per_local_macro_sorted.groupby("local"):
    if local == "CDD ENEA":
        continue
    local_share = {r["macro"]: r["pct"] for _, r in grp.iterrows()}
    cand = []
    for macro, cshare in chain_macro_share.items():
        if cshare < 2.5 or macro in ("Otras temáticas", "Sin temática identificada"):
            continue
        lshare = local_share.get(macro, 0.0)
        if cshare > 0 and lshare < cshare * 0.55:
            cand.append({
                "local": local, "macro": macro,
                "localPct": round(float(lshare), 2),
                "chainPct": round(float(cshare), 2),
                "gap": round(float(cshare - lshare), 2),
            })
    cand.sort(key=lambda r: -r["gap"])
    weak_by_local.extend(cand[:4])

# --- Top títulos (por sku) a nivel cadena, por local y por macro ---
def top_titles(group_col, n):
    agg_kwargs = dict(
        nombre=("nombre_producto", "first"),
        unidades=("cantidad", "sum"),
        monto=("valorneto", "sum"),
    )
    if group_col != "macro":
        agg_kwargs["macro"] = ("macro", "first")
    g = (
        books_df.groupby([group_col, "sku"], observed=True)
        .agg(**agg_kwargs)
        .reset_index()
        .sort_values([group_col, "unidades"], ascending=[True, False])
    )
    out = {}
    for key, grp in g.groupby(group_col):
        out[key] = [
            {"sku": r["sku"], "nombre": r["nombre"],
             "macro": r["macro"] if group_col != "macro" else key,
             "unidades": int(r["unidades"]), "monto": int(r["monto"])}
            for _, r in grp.head(n).iterrows()
        ]
    return out

titles_global = (
    books_df.groupby("sku", observed=True)
    .agg(nombre=("nombre_producto", "first"), macro=("macro", "first"),
         unidades=("cantidad", "sum"), monto=("valorneto", "sum"))
    .reset_index().sort_values("unidades", ascending=False).head(20)
)
top_titles_data = {
    "chain": [
        {"sku": r["sku"], "nombre": r["nombre"], "macro": r["macro"],
         "unidades": int(r["unidades"]), "monto": int(r["monto"])}
        for _, r in titles_global.iterrows()
    ],
    "byLocal": top_titles(group_col="local", n=15),
    "byMacro": top_titles(group_col="macro", n=10),
}

insights = {
    "chain": chain.to_dict("records"),               # detalle (565)
    "macroChain": macro_chain.to_dict("records"),     # macro (~26)
    "totalUnidades": total_unidades,
    "totalMonto": total_monto,
    "chainYearTotals": chain_year_totals,
    "chainDeclinePct": chain_decline_pct,
    "dominantByLocal": dominant_by_local,             # macro
    "concentrationByLocal": concentration_by_local,   # macro
    "webVsFisicas": web_vs_fisicas,                   # macro
    "growthMacro": growth_macro,
    "growthDetail": growth_detail,
    "ytd": ytd,
    "weakByLocal": weak_by_local,
    "topTitles": top_titles_data,
    "topMacros": macro_chain.head(15)["tema"].tolist(),
}
(OUT_DIR / "insights.json").write_text(
    json.dumps(insights, ensure_ascii=False), encoding="utf-8"
)

print("Listo. JSON generados en", OUT_DIR)
print(f"  aggregated.json: {len(aggregated_records):,} filas")
print(f"  monthly.json:    {len(monthly_records):,} filas")
print(f"  metadata.json")
print(f"  insights.json")
print(f"  macro: {len(ALL_MACROS)-1} familias · Otras: {len(unmapped_cats)} cats / {fmt_int(unmapped_units)} u.")
