"""
Mapeo oficial de categorías (fino, ~565 valores, campo `categoria` del CSV de
ventas) a macro-categorías, basado en el archivo entregado por el equipo de
adquisiciones: `categorias_subcategorias_simple_v2.xlsx`.

La hoja "categorias" tiene dos columnas:
  - `categoria`    → macro-categoría (40 valores)
  - `subcategoria` → categoría fina (~558 valores, equivalente al campo
                      `categoria` del CSV de ventas)

Este módulo invierte esa relación (subcategoria → categoria) y expone
`macro_for(categoria)` con la misma interfaz que la versión anterior
(mapeo curado a mano), para que `preprocess.py` no necesite cambios.

Reglas de resolución:
1. Match exacto (tras normalizar espacios) subcategoria → categoria.
2. Si el valor no aparece como subcategoria pero coincide con una
   macro-categoría de nivel superior, se mapea a sí mismo (algunos productos
   del ERP vienen taggeados directo con la macro, sin subcategoría).
3. AMBIGÜEDADES: 17 subcategorías aparecen bajo más de una macro-categoría en
   el archivo fuente. Para la mayoría (bajo volumen: Miscelaneos, Mujer,
   Fotografía, Química, Automovilismo, Telecomunicaciones, Transporte,
   Novelas Ilustradas) se resuelve tomando la primera aparición en el orden
   de la hoja - no altera ninguna lectura de negocio relevante.
   Para las de alto volumen se curó a mano (ver AMBIGUOUS_OVERRIDES), porque
   la primera aparición las mandaba a un lugar claramente equivocado:
     - "Narrativa Extranjera" (38.960 u.), "Narrativa Fantástica" (27.387 u.)
       y "Narrativa Latinoamericana" (22.795 u.) son categorías de ficción
       general para adultos - el archivo las lista primero bajo
       "Libros Juveniles", que las habría subestimado gravemente. Se fuerzan
       a "Literatura".
     - "Psicología Infantil" y "Teatro" se fuerzan a la macro cuyo nombre
       coincide semánticamente ("Psicología y Pedagogía" y
       "Música-Cine-Ballet-Teatro" respectivamente) en vez de la primera
       aparición en la hoja.
4. Sin match alguno → "Otras temáticas".

`Sin temática identificada` (la categoría "(desconocido)" renombrada en
preprocess.py) conserva su propia macro.
"""
import re
import unicodedata
from pathlib import Path

import openpyxl

XLSX_PATH = Path(__file__).resolve().parent / "categorias_subcategorias_simple_v2.xlsx"

M_OTRAS = "Otras temáticas"
M_SIN = "Sin temática identificada"

# Desambiguaciones curadas a mano - ver punto 3 del docstring.
AMBIGUOUS_OVERRIDES = {
    "Narrativa Extranjera": "Literatura",
    "Narrativa Fantástica": "Literatura",
    "Narrativa Latinoamericana": "Literatura",
    "Psicología Infantil": "Psicología y Pedagogía",
    "Teatro": "Música-Cine-Ballet-Teatro",
    "Psicología": "Ciencias Sociales",
}


def _norm(s: str) -> str:
    # Solo colapsa espacios; NO se hace fold de acentos (NFKD) para que las
    # claves calcen con AMBIGUOUS_OVERRIDES tal como están escritas en este
    # archivo (evita descomponer tildes en caracteres combinados).
    s = unicodedata.normalize("NFC", s)
    return re.sub(r"\s+", " ", s).strip()


def _load_mapping():
    wb = openpyxl.load_workbook(XLSX_PATH, read_only=True)
    ws = wb["categorias"]
    rows = list(ws.iter_rows(values_only=True))[1:]

    sub_to_macro: dict[str, str] = {}
    top_level: set[str] = set()

    for categoria, subcategoria in rows:
        if not categoria:
            continue
        categoria = _norm(categoria)
        top_level.add(categoria)
        if subcategoria:
            key = _norm(subcategoria)
            if key in AMBIGUOUS_OVERRIDES:
                sub_to_macro[key] = AMBIGUOUS_OVERRIDES[key]
            elif key not in sub_to_macro:  # primera aparición gana
                sub_to_macro[key] = categoria

    return sub_to_macro, top_level


_SUB_TO_MACRO, _TOP_LEVEL = _load_mapping()

ALL_MACROS = sorted(_TOP_LEVEL) + [M_OTRAS, M_SIN]


def macro_for(categoria: str) -> str:
    if categoria == M_SIN:
        return M_SIN
    key = _norm(categoria)
    if key in _SUB_TO_MACRO:
        return _SUB_TO_MACRO[key]
    if key in _TOP_LEVEL:
        return key
    return M_OTRAS
