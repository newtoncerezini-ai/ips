from __future__ import annotations

import json
from pathlib import Path


DATA_PATH = Path("public/data/dashboard.json")
OUTPUT_DIR = Path("reports/municipios")
TARGETS = ["Recife", "Carnaubeira Da Penha", "Fernando De Noronha"]
YEARS = [2024, 2025, 2026]
IPS = "Índice de Progresso Social"


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
    if not rank:
        return "sem ranking"
    return f"{rank[0]}/{rank[1]}"


def clean_filename(name: str) -> str:
    mapping = str.maketrans("áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ", "aaaaeeiooouucAAAAEEIOOOUUC")
    return name.translate(mapping).lower().replace(" ", "_")


def sentence_list(items: list[str]) -> str:
    if not items:
        return "sem destaques disponíveis"
    if len(items) == 1:
        return items[0]
    return ", ".join(items[:-1]) + " e " + items[-1]


def ranked_items(row: dict, indicators: list[str], reverse: bool = False) -> list[tuple[str, int, int, float | None]]:
    items = []
    for indicator in indicators:
        rank = pe_rank(row, indicator)
        if not rank:
            continue
        items.append((indicator, rank[0], rank[1], get_value(row, indicator)))
    return sorted(items, key=lambda item: item[1], reverse=reverse)


def change_items(rows_by_year: dict[int, dict], indicators: list[str]) -> list[dict]:
    start = rows_by_year.get(2024)
    end = rows_by_year.get(2026)
    if not start or not end:
        return []

    changes = []
    for indicator in indicators:
        start_rank = pe_rank(start, indicator)
        end_rank = pe_rank(end, indicator)
        if not start_rank or not end_rank:
            continue
        start_value = get_value(start, indicator)
        end_value = get_value(end, indicator)
        changes.append(
            {
                "indicator": indicator,
                "rank_change": start_rank[0] - end_rank[0],
                "start_rank": start_rank[0],
                "end_rank": end_rank[0],
                "value_delta": None if start_value is None or end_value is None else end_value - start_value,
            }
        )
    return changes


def generate_report(data: dict, municipality: str) -> str:
    rows = [row for row in data["records"] if row["municipality"].lower() == municipality.lower()]
    if not rows:
        raise ValueError(f"Município não encontrado: {municipality}")

    rows_by_year = {row["year"]: row for row in rows}
    current = rows_by_year[2026]
    # Components are the indicator-level IPS scores below the three broad dimensions.
    # They are all comparable on a positive 0-100 scale, unlike several raw variables
    # whose direction can be inverted depending on the methodology.
    indicator_names = [indicator for indicator in data["components"] if pe_rank(current, indicator)]

    ips_series = [get_value(rows_by_year[year], IPS) for year in YEARS if year in rows_by_year]
    ips_2024 = get_value(rows_by_year[2024], IPS)
    ips_2026 = get_value(current, IPS)
    ips_delta = None if ips_2024 is None or ips_2026 is None else ips_2026 - ips_2024
    ips_rank_pe = pe_rank(current, IPS)
    ips_rank_br = br_rank(current, IPS)

    strengths = ranked_items(current, indicator_names)[:8]
    critical = ranked_items(current, indicator_names, reverse=True)[:8]
    changes = change_items(rows_by_year, indicator_names)
    improvements = sorted([item for item in changes if item["value_delta"] is not None and item["value_delta"] > 0], key=lambda item: item["value_delta"], reverse=True)[:6]
    declines = sorted([item for item in changes if item["value_delta"] is not None and item["value_delta"] < 0], key=lambda item: item["value_delta"])[:6]

    strength_names = [f"{name} ({rank}/{total})" for name, rank, total, _ in strengths[:4]]
    critical_names = [f"{name} ({rank}/{total})" for name, rank, total, _ in critical[:4]]

    lines = [
        f"# Relatório sintético - {current['municipality']}",
        "",
        f"**Região de Desenvolvimento:** {current['region']}  ",
        f"**Ano de referência:** 2026  ",
        f"**IPS 2026:** {format_number(ips_2026)} | **Ranking PE:** {rank_text(ips_rank_pe)} | **Ranking Brasil:** {rank_text(ips_rank_br)}",
        "",
        "## Leitura executiva",
        "",
        (
            f"{current['municipality']} apresenta IPS de {format_number(ips_2026)} em 2026, "
            f"com variação de {format_delta(ips_delta)} ponto entre 2024 e 2026. "
            f"A série disponível é: 2024 {format_number(ips_series[0])}, "
            f"2025 {format_number(ips_series[1])} e 2026 {format_number(ips_series[2])}. "
            f"No recorte estadual, o município ocupa a posição {rank_text(ips_rank_pe)}."
        ),
        "",
        (
            "Os principais pontos fortes, olhando os indicadores/componentes do IPS abaixo dos grandes temas, concentram-se em "
            f"{sentence_list(strength_names)}. Já os pontos críticos aparecem em "
            f"{sentence_list(critical_names)}. Essa leitura usa a posição relativa entre os 185 municípios de Pernambuco, "
            "com indicadores comparáveis em escala positiva de 0 a 100."
        ),
        "",
        "## Pontos fortes em 2026",
        "",
    ]

    for name, rank, total, value in strengths:
        lines.append(f"- **{name}:** valor {format_number(value)}; posição PE {rank}/{total}.")

    lines.extend(["", "## Pontos críticos em 2026", ""])
    for name, rank, total, value in critical:
        lines.append(f"- **{name}:** valor {format_number(value)}; posição PE {rank}/{total}.")

    lines.extend(["", "## Maiores avanços entre 2024 e 2026", ""])
    if improvements:
        for item in improvements:
            lines.append(
                f"- **{item['indicator']}:** subiu {format_delta(item['value_delta'])} pontos "
                f"e passou da posição {item['start_rank']}º para {item['end_rank']}º em PE."
            )
    else:
        lines.append("- Não houve avanço mensurável nos indicadores com ranking disponível nos dois anos.")

    lines.extend(["", "## Maiores pioras entre 2024 e 2026", ""])
    if declines:
        for item in declines:
            lines.append(
                f"- **{item['indicator']}:** caiu {format_number(abs(item['value_delta']))} pontos "
                f"e passou da posição {item['start_rank']}º para {item['end_rank']}º em PE."
            )
    else:
        lines.append("- Não houve piora mensurável nos indicadores com ranking disponível nos dois anos.")

    lines.extend(
        [
            "",
            "## Síntese para acompanhamento",
            "",
            (
                "A recomendação é acompanhar, em primeiro lugar, os indicadores críticos que também perderam posição no período, "
                "pois eles combinam baixo desempenho relativo e trajetória negativa. Em paralelo, os pontos fortes devem ser tratados "
                "como capacidades instaladas do município, úteis para orientar prioridades e identificar políticas que podem ser preservadas "
                "ou ampliadas. Este relatório é um protótipo automatizado e deve ser lido como apoio à análise técnica, não como diagnóstico causal fechado."
            ),
            "",
        ]
    )

    return "\n".join(lines)


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for municipality in TARGETS:
        report = generate_report(data, municipality)
        output = OUTPUT_DIR / f"{clean_filename(municipality)}.md"
        output.write_text(report, encoding="utf-8")
        print(output)


if __name__ == "__main__":
    main()
