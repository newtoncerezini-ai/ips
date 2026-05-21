from __future__ import annotations

import json
import unicodedata
from pathlib import Path


DATA_PATH = Path("public/data/dashboard.json")
OUTPUT_DIR = Path("reports/municipios")
TARGETS = ["Recife", "Caruaru"]
YEARS = [2024, 2025, 2026]
IPS = "Índice de Progresso Social"
GDP = "PIB per capita"
EXCLUDED = {IPS, GDP, "População", "Área (km²)"}


def format_number(value: float | int | None, digits: int = 2) -> str:
    if value is None:
        return "sem dado"
    text = f"{value:,.{digits}f}"
    return text.replace(",", "X").replace(".", ",").replace("X", ".")


def format_delta(value: float | int | None, digits: int = 2) -> str:
    if value is None:
        return "sem dado"
    sign = "+" if value > 0 else ""
    return f"{sign}{format_number(value, digits)}"


def get_value(row: dict, indicator: str) -> float | None:
    value = row["values"].get(indicator)
    return value if isinstance(value, (int, float)) else None


def pe_rank(row: dict, indicator: str) -> tuple[int, int] | None:
    rank = row.get("ranks", {}).get(indicator, {}).get("pe")
    if not rank:
        return None
    return int(rank["position"]), int(rank["total"])


def br_rank(row: dict, indicator: str) -> tuple[int, int] | None:
    rank = row.get("ranks", {}).get(indicator, {}).get("br")
    if not rank:
        return None
    return int(rank["position"]), int(rank["total"])


def rank_text(rank: tuple[int, int] | None) -> str:
    return "sem ranking" if not rank else f"{rank[0]}/{rank[1]}"


def clean_filename(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name)
    ascii_name = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    return ascii_name.lower().replace(" ", "_")


def sentence_list(items: list[str]) -> str:
    if not items:
        return "sem destaques disponíveis"
    if len(items) == 1:
        return items[0]
    return ", ".join(items[:-1]) + " e " + items[-1]


def direction_text(polarity: str) -> str:
    return "menor é melhor" if polarity == "lower" else "maior é melhor"


def favorable_delta(delta: float, polarity: str) -> bool:
    return delta < 0 if polarity == "lower" else delta > 0


def indicator_names(data: dict, current: dict) -> list[str]:
    dimensions = set(data["dimensions"])
    components = set(data["components"])
    return [
        indicator
        for indicator in data["indicators"]
        if indicator not in EXCLUDED
        and indicator not in dimensions
        and indicator not in components
        and pe_rank(current, indicator)
    ]


def ranked_items(row: dict, indicators: list[str]) -> list[tuple[str, int, int, float | None]]:
    items = []
    for indicator in indicators:
        rank = pe_rank(row, indicator)
        if rank:
            items.append((indicator, rank[0], rank[1], get_value(row, indicator)))
    return sorted(items, key=lambda item: item[1])


def change_items(rows_by_year: dict[int, dict], indicators: list[str], polarity: dict[str, str]) -> list[dict]:
    start = rows_by_year.get(2024)
    end = rows_by_year.get(2026)
    if not start or not end:
        return []

    changes = []
    for indicator in indicators:
        start_value = get_value(start, indicator)
        end_value = get_value(end, indicator)
        start_rank = pe_rank(start, indicator)
        end_rank = pe_rank(end, indicator)
        if start_value is None or end_value is None or not start_rank or not end_rank:
            continue
        value_delta = end_value - start_value
        item_polarity = polarity.get(indicator, "higher")
        changes.append(
            {
                "indicator": indicator,
                "polarity": item_polarity,
                "rank_change": start_rank[0] - end_rank[0],
                "start_rank": start_rank[0],
                "end_rank": end_rank[0],
                "value_delta": value_delta,
                "is_improvement": favorable_delta(value_delta, item_polarity),
            }
        )
    return changes


def generate_report(data: dict, municipality: str) -> str:
    rows = [row for row in data["records"] if row["municipality"].lower() == municipality.lower()]
    if not rows:
        raise ValueError(f"Município não encontrado: {municipality}")

    rows_by_year = {row["year"]: row for row in rows}
    current = rows_by_year[2026]
    polarity = data.get("indicatorPolarity", {})
    indicators = indicator_names(data, current)

    ips_series = [get_value(rows_by_year[year], IPS) for year in YEARS]
    ips_delta = None if ips_series[0] is None or ips_series[-1] is None else ips_series[-1] - ips_series[0]
    strengths = ranked_items(current, indicators)[:8]
    critical = ranked_items(current, indicators)[-8:][::-1]
    changes = change_items(rows_by_year, indicators, polarity)
    improvements = sorted([item for item in changes if item["is_improvement"]], key=lambda item: (item["rank_change"], abs(item["value_delta"])), reverse=True)[:6]
    declines = sorted([item for item in changes if not item["is_improvement"]], key=lambda item: (item["rank_change"], -abs(item["value_delta"])))[:6]

    strength_names = [f"{name} ({rank}/{total})" for name, rank, total, _ in strengths[:4]]
    critical_names = [f"{name} ({rank}/{total})" for name, rank, total, _ in critical[:4]]

    lines = [
        f"# Relatório sintético - {current['municipality']}",
        "",
        f"**Região de Desenvolvimento:** {current['region']}  ",
        "**Ano de referência:** 2026  ",
        f"**IPS 2026:** {format_number(get_value(current, IPS))} | **Ranking PE:** {rank_text(pe_rank(current, IPS))} | **Ranking Brasil:** {rank_text(br_rank(current, IPS))}",
        "",
        "## Leitura executiva",
        "",
        (
            f"{current['municipality']} apresenta IPS de {format_number(get_value(current, IPS))} em 2026, "
            f"com variação de {format_delta(ips_delta)} ponto entre 2024 e 2026. "
            f"A série disponível é: 2024 {format_number(ips_series[0])}, "
            f"2025 {format_number(ips_series[1])} e 2026 {format_number(ips_series[2])}. "
            f"No recorte estadual, o município ocupa a posição {rank_text(pe_rank(current, IPS))}."
        ),
        "",
        (
            "No nível dos indicadores, e não dos eixos ou componentes, os principais pontos fortes são "
            f"{sentence_list(strength_names)}. Os pontos críticos aparecem em "
            f"{sentence_list(critical_names)}. A leitura considera a polaridade de cada indicador: em alguns casos maior é melhor, "
            "em outros menor é melhor, como mortalidade, abandono, violência e perdas."
        ),
        "",
        "## Pontos fortes em 2026",
        "",
    ]

    for name, rank, total, value in strengths:
        lines.append(f"- **{name}:** valor {format_number(value)}; posição PE {rank}/{total}; polaridade: {direction_text(polarity.get(name, 'higher'))}.")

    lines.extend(["", "## Pontos críticos em 2026", ""])
    for name, rank, total, value in critical:
        lines.append(f"- **{name}:** valor {format_number(value)}; posição PE {rank}/{total}; polaridade: {direction_text(polarity.get(name, 'higher'))}.")

    lines.extend(["", "## Maiores avanços entre 2024 e 2026", ""])
    if improvements:
        for item in improvements:
            movement = "ganhou" if item["rank_change"] >= 0 else "perdeu"
            lines.append(
                f"- **{item['indicator']}:** {movement} {abs(item['rank_change'])} posições em PE "
                f"({item['start_rank']}º para {item['end_rank']}º); variação do valor {format_delta(item['value_delta'])}; "
                f"polaridade: {direction_text(item['polarity'])}."
            )
    else:
        lines.append("- Não houve avanço mensurável nos indicadores com dado disponível em 2024 e 2026.")

    lines.extend(["", "## Maiores pioras entre 2024 e 2026", ""])
    if declines:
        for item in declines:
            movement = "ganhou" if item["rank_change"] >= 0 else "perdeu"
            lines.append(
                f"- **{item['indicator']}:** {movement} {abs(item['rank_change'])} posições em PE "
                f"({item['start_rank']}º para {item['end_rank']}º); variação do valor {format_delta(item['value_delta'])}; "
                f"polaridade: {direction_text(item['polarity'])}."
            )
    else:
        lines.append("- Não houve piora mensurável nos indicadores com dado disponível em 2024 e 2026.")

    lines.extend(
        [
            "",
            "## Síntese para acompanhamento",
            "",
            (
                "A prioridade analítica deve combinar dois sinais: indicadores em posição crítica em 2026 e indicadores que pioraram no período. "
                "Esses casos merecem leitura setorial antes de qualquer conclusão causal. Os pontos fortes indicam capacidades relativas do município "
                "e podem orientar preservação de políticas, difusão de práticas ou investigação de fatores locais associados ao bom desempenho."
            ),
            "",
        ]
    )
    return "\n".join(lines)


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for municipality in TARGETS:
        output = OUTPUT_DIR / f"{clean_filename(municipality)}.md"
        output.write_text(generate_report(data, municipality), encoding="utf-8")
        print(output)


if __name__ == "__main__":
    main()
