#!/usr/bin/env python3
"""Генерация sexProfileFemale.ts и sexProfileMale.ts."""
from __future__ import annotations
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

FEMALE_AWARENESS_YES = {2, 3, 5, 6, 8, 12, 17, 18}
MALE_AWARENESS_YES = {3, 4, 7, 10, 12, 14, 16, 18}

FEMALE_WELLBEING_YES = {5, 10}
MALE_WELLBEING_YES = {4, 7, 8}

FEMALE_SATISFACTION_YES = {1, 2, 3, 5, 6, 8, 9}
MALE_SATISFACTION_YES = {1, 2, 3, 5, 6, 8, 9}

FEMALE_SENSUALITY_YES = {1, 2, 4, 6, 8, 9, 10}
MALE_SENSUALITY_YES = {1, 2, 4, 6, 8, 9, 10}

FEMALE_COMMUNICATION_YES = {1, 3, 4, 6, 7}
MALE_COMMUNICATION_YES = {1, 3, 4, 6, 7}

FEMALE_CONFIDENCE_YES = {3, 4, 5, 10}
MALE_CONFIDENCE_YES = {5, 6, 10}

FEMALE_TECHNIQUE_YES = {1, 2, 3, 4, 6, 7, 8, 10}
MALE_TECHNIQUE_YES = {1, 2, 3, 4, 6, 7, 8, 10}

FEMALE_OPENNESS_YES = {2, 3, 4, 5, 9, 10}
MALE_OPENNESS_YES = {2, 3, 4, 5, 9, 10}

ATTRACTION_F = [
    ["менее одного раза в неделю / от 55: редко или никогда", "один или два раза в неделю / от 55: один-два раза каждые 2 недели", "более трех раз в неделю / от 55: более одного раза в неделю"],
    ["в более позднем возрасте, чем большинство ваших подруг", "приблизительно в то же время, как и большинство ваших подруг", "раньше, чем большинство ваших подруг"],
    ["редко или никогда", "1-2 раза в неделю", "несколько раз в неделю"],
    ["только после значительной стимуляции", "довольно легко", "легко и быстро"],
    ["редко бывает оргазм или никогда его не испытываю", "приблизительно через четверть часа", "через 5 мин"],
    ["редко или никогда", "почти каждый день", "по нескольку раз в день"],
    ["редко или никогда", "иногда", "часто"],
    ["никогда", "редко", "несколько раз"],
    ["никогда", "иногда", "всегда"],
    ["если соглашаюсь, то из-за общей благожелательности или вялости", "чаще соглашаюсь, чем отказываюсь", "почти всегда откликаюсь с готовностью"],
]

ATTRACTION_M = [
    ["менее одного раза в неделю / от 55: редко или никогда", "один или два раза в неделю / от 55: один-два раза каждые 2 недели", "более трех раз в неделю / от 55: более одного раза в неделю"],
    ["один раз в неделю или реже", "два-три раза в неделю", "по крайней мере 4-6 раз в неделю"],
    ["в более позднем возрасте, чем большинство ваших друзей", "приблизительно в то же время, как и большинство ваших друзей", "раньше, чем большинство ваших друзей"],
    ["редко или никогда", "один-два раза в неделю", "весьма часто"],
    ["редко или никогда", "не очень часто", "часто"],
    ["редко или никогда", "иногда", "очень часто"],
    ["редко или никогда", "почти каждый день", "по нескольку раз в день"],
    ["никогда", "редко", "несколько раз"],
    ["совершенно на вас не действуют", "иногда вас возбуждают", "всегда вас возбуждают"],
    ["просто дружеские, без сексуальной тональности", "сильно окрашены в сексуальные тона", "сексуальны"],
]


def yn_item(text: str, yes_scores: bool) -> dict:
    return {"title": text, "options": (["Нет", "Да"] if yes_scores else ["Да", "Нет"])}


def mc_item(text: str, options: list[str]) -> dict:
    return {"title": text, "options": options}


def parse_blank(path: Path) -> list[str]:
    lines = [ln.strip() for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip()]
    questions: list[str] = []
    i = 0
    while i < len(lines):
        m = re.match(r"^(\d+)\.\s+(.+)", lines[i])
        if not m:
            i += 1
            continue
        num = int(m.group(1))
        if num > 100:
            break
        q = m.group(2).strip()
        i += 1
        while i < len(lines):
            nxt = lines[i]
            if re.match(r"^\d+\.\s+", nxt):
                break
            if nxt in ("Да", "Нет"):
                break
            if num >= 21 and num <= 30 and not nxt.startswith("Представленный"):
                # option line for MC — stop collecting title at first option-like line
                if questions and len(questions) == num - 1:
                    # first option after title — don't add to title
                    break
            if nxt.startswith("Представленный"):
                break
            q += " " + nxt
            i += 1
        q = re.sub(r"&nbsp;", " ", q)
        questions.append(re.sub(r"\s+", " ", q).strip())
    return questions[:100]


def build_items(questions: list[str], gender: str) -> list[dict]:
    items: list[dict] = []
    awareness_yes = FEMALE_AWARENESS_YES if gender == "f" else MALE_AWARENESS_YES
    for i, q in enumerate(questions[:20], 1):
        items.append(yn_item(q, i in awareness_yes))

    attraction_opts = ATTRACTION_F if gender == "f" else ATTRACTION_M
    for j, q in enumerate(questions[20:30]):
        items.append(mc_item(q, attraction_opts[j]))

    wb_yes = FEMALE_WELLBEING_YES if gender == "f" else MALE_WELLBEING_YES
    for i, q in enumerate(questions[30:40], 1):
        items.append(yn_item(q, i in wb_yes))

    sat_yes = FEMALE_SATISFACTION_YES if gender == "f" else MALE_SATISFACTION_YES
    for i, q in enumerate(questions[40:50], 1):
        items.append(yn_item(q, i in sat_yes))

    sens_yes = FEMALE_SENSUALITY_YES if gender == "f" else MALE_SENSUALITY_YES
    for i, q in enumerate(questions[50:60], 1):
        items.append(yn_item(q, i in sens_yes))

    comm_yes = FEMALE_COMMUNICATION_YES if gender == "f" else MALE_COMMUNICATION_YES
    for i, q in enumerate(questions[60:70], 1):
        items.append(yn_item(q, i in comm_yes))

    conf_yes = FEMALE_CONFIDENCE_YES if gender == "f" else MALE_CONFIDENCE_YES
    for i, q in enumerate(questions[70:80], 1):
        items.append(yn_item(q, i in conf_yes))

    tech_yes = FEMALE_TECHNIQUE_YES if gender == "f" else MALE_TECHNIQUE_YES
    for i, q in enumerate(questions[80:90], 1):
        items.append(yn_item(q, i in tech_yes))

    open_yes = FEMALE_OPENNESS_YES if gender == "f" else MALE_OPENNESS_YES
    for i, q in enumerate(questions[90:100], 1):
        items.append(yn_item(q, i in open_yes))

    return items


def repr_items(items: list[dict]) -> str:
    parts = ["["]
    for it in items:
        opts = ", ".join(repr(o) for o in it["options"])
        parts.append(f"  {{ title: {it['title']!r}, options: [{opts}] }},")
    parts.append("]")
    return "\n".join(parts)


def emit_ts(name: str, var: str, items: list[dict], label: str, badge: str, desc: str) -> str:
    short = label.split("—")[0].strip()
    return f"""import type {{ TestConfig }} from '../types'
import {{ scoreSexProfile }} from '../lib/sexologyScorers'

const items = {repr_items(items)}

export const {var}: TestConfig = {{
  id: '{name}',
  category: 'Сексология',
  label: '{label}',
  badge: '{badge}',
  desc: '{desc}',
  kind: 'bdi',
  items,
  digitMin: 0,
  digitMax: 2,
  printable: true,
  blankLayout: 'list',
  blankInstruction:
    'Ответьте на каждый вопрос. Цифра слева — балл выбранного варианта; суммируется по 9 подшкалам профиля (Яффе и Фенвик).',
  score: (a) => scoreSexProfile(a, '{short}'),
}}
"""


def main():
    configs = [
        ("f", "blank_female.txt", "sxpf", "sexProfileFemaleTest",
         "Сексуальный профиль женщины — Яффе", "100 вопросов · 9 подшкал",
         "Опросник М. Яффе и Э. Фенвик «Секс в жизни женщины». Подшкалы: осведомлённость (0–20), влечение (0–20), благополучие, удовлетворённость, чувственность, общительность, уверенность, техника, широта взглядов (по 0–10)."),
        ("m", "blank_male.txt", "sxpm", "sexProfileMaleTest",
         "Сексуальный профиль мужчины — Яффе", "100 вопросов · 9 подшкал",
         "Опросник М. Яффе и Э. Фенвик «Секс в жизни мужчины». Те же 9 подшкал, что и в женской версии."),
    ]
    for gender, fname, tid, var, label, badge, desc in configs:
        qs = parse_blank(ROOT / "scripts" / fname)
        if len(qs) != 100:
            raise SystemExit(f"{gender}: parsed {len(qs)} questions, expected 100")
        items = build_items(qs, gender)
        out = emit_ts(tid, var, items, label, badge, desc)
        target = ROOT / "src/data" / f"sexProfile{gender.upper() if gender=='f' else 'Male' if gender=='m' else ''}.ts"
        if gender == "f":
            target = ROOT / "src/data/sexProfileFemale.ts"
        else:
            target = ROOT / "src/data/sexProfileMale.ts"
        target.write_text(out, encoding="utf-8")
        print(f"Wrote {target.name}: {items[0]['title'][:50]}...")


if __name__ == "__main__":
    main()
