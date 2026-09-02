import type { Level, TestConfig } from '../types'
import type { CalcOk } from './scoring'
import { computeScl90, type Scl90Report } from './scl90'
import { computeWippf, type WippfReport } from './wippf'

export interface VisualMetric {
  name: string
  value: string
  hint?: string
  level?: Level
}

export interface VisualItem {
  label: string
  value: string
  hint?: string
  level?: Level
  /** Для шкальных баров (0–1) */
  ratio?: number
}

export interface VisualResultModel {
  level: Level | 'none'
  verdict: string
  detail?: string
  metrics?: VisualMetric[]
  focus?: VisualItem[]
  items?: VisualItem[]
  footnote?: string
  /** Полный SCL-отчёт — для расширенной сетки шкал */
  scl90?: Scl90Report
  /** WIPPF 2.0 — группы шкал и агрегаты */
  wippf?: WippfReport
}

const LEVEL_DETAIL: Record<Level, string> = {
  low: 'По текущему результату выраженных проблем не отмечается. Ориентир для скрининга, не диагноз.',
  moderate: 'Есть признаки умеренной выраженности — имеет смысл обсудить на приёме и при необходимости углубить оценку.',
  high: 'Выраженный уровень по шкале — рекомендуется клиническая оценка и дальнейшее ведение.',
}

function inferLevelFromText(text: string, fallback?: Level): Level | 'none' {
  if (fallback) return fallback
  const t = text.toLowerCase()
  if (
    /тяжёл|тяжел|клиническ|высоки?й\s+риск|возможна\s+зависимость|выраженн|≥\s*53|≥\s*35|выше порога дисфункции|нарушенн|нужна\s+срочн/.test(
      t,
    )
  ) {
    return 'high'
  }
  if (/умерен|субклини|лёгк|легк|повышен|опасн|вредн|скринингов/.test(t)) {
    return 'moderate'
  }
  if (
    /минимал|норма|не выявлен|ниже порог|без\s|не достигнут|существенных проблем не|в пределах/.test(t)
  ) {
    return 'low'
  }
  return 'none'
}

function levelWord(level: Level | 'none'): string {
  if (level === 'low') return 'низкий / норма'
  if (level === 'moderate') return 'умеренный'
  if (level === 'high') return 'высокий'
  return 'ориентир'
}

/** «27 баллов — Тяжёлые симптомы» */
function parseScoreDashLabel(text: string): { score?: string; label?: string } | null {
  const m = text.match(/^(\d+(?:[.,]\d+)?)\s*баллов?\s*[—–-]\s*(.+)$/i)
  if (!m) return null
  return { score: m[1], label: m[2]!.trim() }
}

/** «NAME: 12/40 — explanation» или «NAME: 7/7 текущих симптомов — explanation» */
function parseNamedScore(text: string): { name: string; score: string; max?: string; rest: string } | null {
  const m = text.match(
    /^([A-Za-zА-Яа-яЁё0-9._-]{2,24})\s*:\s*(\d+(?:[.,]\d+)?)(?:\s*\/\s*(\d+(?:[.,]\d+)?))?(?:\s+[^—–.\n]{0,48})?\s*[—–-]\s*([\s\S]+)$/,
  )
  if (!m) return null
  return { name: m[1]!, score: m[2]!, max: m[3], rest: m[4]!.trim() }
}

/** ASQ: ответов «Да» — 5/5 (скрининг 4/4, острота 1/1). */
function parseAsq(text: string): VisualResultModel | null {
  const m = text.match(/ASQ:.*?(\d+)\s*\/\s*5.*?скрининг\s*(\d+)\s*\/\s*4.*?острота\s*(\d+)\s*\/\s*1/i)
  if (!m) return null
  const total = Number(m[1])
  const screen = Number(m[2])
  const acute = Number(m[3])
  const level: Level = acute >= 1 || total >= 2 ? 'high' : total === 1 ? 'moderate' : 'low'
  const verdict =
    acute >= 1
      ? 'Есть острота — нужна срочная оценка безопасности'
      : total >= 2
        ? 'Положительный скрининг суицидального риска'
        : total === 1
          ? 'Есть один положительный пункт скрининга'
          : 'Отрицательный скрининг по ASQ'
  return {
    level,
    verdict,
    detail: text,
    metrics: [
      { name: 'Да', value: `${total}/5`, hint: 'всего положительных', level },
      { name: 'Скрининг', value: `${screen}/4`, hint: 'пункты 1–4' },
      { name: 'Острота', value: `${acute}/1`, hint: 'пункт 5', level: acute >= 1 ? 'high' : 'low' },
    ],
    footnote: 'ASQ — скрининг, не диагноз. При остроте действуйте по локальному протоколу безопасности.',
  }
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function extractSubscales(text: string): VisualItem[] {
  const items: VisualItem[] = []
  // Подшкалы: A 1; B 2 / Coping: 7/35; Control: 8/40
  const sub = text.match(/Подшкалы?:\s*([^.]+)/i) || text.match(/Домены?:\s*([^.]+)/i)
  if (sub?.[1]) {
    for (const part of sub[1].split(/;|·|,/)) {
      const p = part.trim()
      if (!p) continue
      const m =
        p.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)(?:\s*\/\s*(\d+(?:[.,]\d+)?))?$/) ||
        p.match(/^(.+?):\s*(\d+(?:[.,]\d+)?)(?:\s*\/\s*(\d+(?:[.,]\d+)?))?(.*)$/)
      if (m) {
        items.push({
          label: m[1]!.trim(),
          value: m[3] ? `${m[2]}/${m[3]}` : m[2]!,
          hint: m[4]?.trim() || undefined,
        })
      } else {
        items.push({ label: p, value: '' })
      }
    }
  }

  // HADS-like: Тревога: 7 (норма), Депрессия: 8 (субклинически)
  if (!items.length) {
    const re =
      /([А-ЯA-Z][А-Яа-яA-Za-zёЁ\s/-]{1,40}?):\s*(\d+(?:[.,]\d+)?)(?:\s*\/\s*(\d+))?(?:\s*\(([^)]+)\))?/g
    let m: RegExpExecArray | null
    const found: VisualItem[] = []
    while ((m = re.exec(text))) {
      const label = m[1]!.trim()
      if (/^(итоговый|общий|итог|gsi|pst|psdi)$/i.test(label)) continue
      const value = m[3] ? `${m[2]}/${m[3]}` : m[2]!
      const hint = m[4]?.trim()
      let level: Level | undefined
      if (hint) {
        const h = hint.toLowerCase()
        if (/норм|миним|не дости/.test(h)) level = 'low'
        else if (/субклини|лёгк|умерен|повыш/.test(h)) level = 'moderate'
        else if (/клинич|тяжёл|высоки|выражен/.test(h)) level = 'high'
      }
      found.push({ label, value, hint, level })
    }
    if (found.length >= 2) return found
  }
  return items
}

function detailFromRest(rest: string, level: Level | 'none'): string {
  const clean = rest.replace(/\s+/g, ' ').trim()
  if (clean.length > 20) return clean
  if (level === 'none') return clean || 'Результат рассчитан.'
  return LEVEL_DETAIL[level]
}

/**
 * Строит визуальную модель для блока «Результат».
 * `res.text` для сводки/копирования не меняется.
 */
export function deriveVisualResult(test: TestConfig, res: CalcOk, answers?: number[]): VisualResultModel {
  // SCL-90 — богатый профиль
  if (test.id === 'scl90' && answers && answers.length >= 90) {
    const report = computeScl90(answers)
    return {
      level: report.level,
      verdict: report.verdict,
      detail: report.conclusion,
      metrics: [
        {
          name: 'GSI',
          value: report.gsi.toFixed(2),
          hint: `общий индекс тяжести · ${levelWord(report.level)}`,
          level: report.level,
        },
        {
          name: 'PST',
          value: `${report.pst}/90`,
          hint: 'сколько симптомов отмечено',
        },
        {
          name: 'PSDI',
          value: report.psdi.toFixed(2),
          hint: 'средняя сила отмеченных симптомов',
        },
      ],
      focus: report.elevated.map((s) => ({
        label: `${s.code} · ${s.name}`,
        value: s.mean.toFixed(2),
        hint: `${s.flag} (${s.short})`,
        level: s.level,
      })),
      items: report.scales.map((s) => ({
        label: s.code,
        value: s.mean.toFixed(2),
        hint: `${s.flag} · ${s.name}`,
        level: s.level,
      })),
      footnote:
        'Ориентиры: <0,7 — норма; ≥0,7 — повышено; ≥1,5 — высоко. Ответы 1–5 → шкала 0–4. Не заменяет диагноз.',
      scl90: report,
    }
  }

  // WIPPF 2.0 — профиль актуальных способностей
  if (test.id === 'wippf' && answers && answers.length >= 88) {
    const report = computeWippf(answers)
    const conflictTop = [...report.conflict].sort((a, b) => b.score - a.score)[0]
    return {
      level: report.level,
      verdict: report.verdict,
      detail: report.conclusion,
      metrics: [
        {
          name: 'Крайние',
          value: String(report.extremes.length),
          hint: `↑${report.high.length} / ↓${report.low.length} из 29`,
          level: report.extremes.length >= 8 ? 'high' : report.extremes.length <= 2 ? 'low' : 'moderate',
        },
        {
          name: 'Конфликт',
          value: conflictTop ? `${conflictTop.code} ${conflictTop.score}` : '—',
          hint: conflictTop ? conflictTop.name : undefined,
          level: conflictTop?.level,
        },
        {
          name: 'a / r / k',
          value: report.agg
            .filter((x) => ['a', 'r', 'k'].includes(x.id))
            .map((x) => x.value)
            .join('/'),
          hint: 'нормы: поведение / ожидания / идеалы',
        },
        {
          name: 'e / w / i',
          value: report.agg
            .filter((x) => ['e', 'w', 'i'].includes(x.id))
            .map((x) => x.value)
            .join('/'),
          hint: 'отношения: к себе / к другим / идеал',
        },
      ],
      focus: report.extremes.slice(0, 10).map((s) => ({
        label: `${s.code} · ${s.name}`,
        value: `${s.score}/12`,
        hint: s.level === 'high' ? s.highPole : s.lowPole,
        level: s.level,
        ratio: (s.score - 3) / 9,
      })),
      items: report.scales.map((s) => ({
        label: s.code,
        value: String(s.score),
        hint: `${s.flag} · ${s.name}`,
        level: s.level,
        ratio: (s.score - 3) / 9,
      })),
      footnote:
        '3–5 — слабо; 6–9 — баланс; 10–12 — выражено. Низкий/высокий балл — полюса, не «плохо/хорошо». Не заменяет клинический разбор.',
      wippf: report,
    }
  }

  const text = res.text.trim()
  const level = inferLevelFromText(text, res.level)

  const asq = parseAsq(text)
  if (asq) return asq

  // Классический формат interpretation: «N баллов — Label»
  const dash = parseScoreDashLabel(text)
  if (dash?.label) {
    return {
      level,
      verdict: dash.label,
      detail: level === 'none' ? 'Результат рассчитан по шкале.' : LEVEL_DETAIL[level],
      metrics: [
        {
          name: 'Итог',
          value: dash.score ?? String(res.score ?? '—'),
          hint: 'баллов',
          level: level === 'none' ? undefined : level,
        },
      ],
      footnote: 'Скрининговый ориентир; не заменяет клинический диагноз.',
    }
  }

  const named = parseNamedScore(text)
  if (named) {
    const sentences = splitSentences(named.rest)
    const first = sentences[0] || named.rest
    const restDetail = sentences.slice(1).join(' ')
    const verdictRaw = first.replace(/\.$/, '')
    const subscales = extractSubscales(text)
    const metrics: VisualMetric[] = [
      {
        name: named.name,
        value: named.max ? `${named.score}/${named.max}` : named.score,
        hint: levelWord(level),
        level: level === 'none' ? undefined : level,
      },
    ]
    // Если «вердикт» слишком длинный — короткая шапка из имени + балла, полный текст в detail
    const long = verdictRaw.length > 88
    return {
      level,
      verdict: long ? `${named.name}: ${named.score}${named.max ? `/${named.max}` : ''}` : verdictRaw,
      detail: detailFromRest(long ? named.rest : restDetail || '', level),
      metrics,
      focus: subscales.filter((s) => s.level && s.level !== 'low'),
      items: subscales.length ? subscales : undefined,
      footnote: 'Скрининговый ориентир; не заменяет клинический диагноз.',
    }
  }

  // HADS и похожие без «NAME: score —»
  const multi = extractSubscales(text)
  if (multi.length >= 2 && !/^[A-Za-z]{2,10}:/.test(text)) {
    const worst =
      multi.some((m) => m.level === 'high')
        ? 'high'
        : multi.some((m) => m.level === 'moderate')
          ? 'moderate'
          : multi.every((m) => m.level === 'low')
            ? 'low'
            : level
    const verdict =
      worst === 'high'
        ? 'Есть клинически значимые показатели'
        : worst === 'moderate'
          ? 'Есть умеренные / субклинические признаки'
          : worst === 'low'
            ? 'Существенных проблем не видно'
            : 'Результат по шкалам'
    return {
      level: worst,
      verdict,
      detail: text,
      metrics: multi.slice(0, 4).map((m) => ({
        name: m.label,
        value: m.value,
        hint: m.hint,
        level: m.level,
      })),
      items: multi,
      footnote: 'Скрининговый ориентир; не заменяет клинический диагноз.',
    }
  }

  // Fallback: первая фраза — вывод, остальное — пояснение
  const sentences = splitSentences(text)
  const verdict = (sentences[0] || text).replace(/\.$/, '')
  const detail = sentences.slice(1).join(' ') || (level !== 'none' ? LEVEL_DETAIL[level] : undefined)
  const scoreMetric =
    res.score !== undefined
      ? [
          {
            name: 'Итог',
            value: String(res.score),
            hint: 'баллов',
            level: level === 'none' ? undefined : level,
          } satisfies VisualMetric,
        ]
      : undefined

  return {
    level,
    verdict: verdict.length > 120 ? `${verdict.slice(0, 117)}…` : verdict,
    detail,
    metrics: scoreMetric,
    footnote: 'Скрининговый ориентир; не заменяет клинический диагноз.',
  }
}

/** Показывать визуальную карточку только при успешном расчёте */
export function isPendingResultText(text: string): boolean {
  return (
    !text ||
    text === 'Ожидание расчёта' ||
    text.startsWith('Неполный ввод') ||
    text.startsWith('Не все ответы') ||
    text.startsWith('Цифры должны') ||
    text.startsWith('Введите') ||
    text.startsWith('Проверьте') ||
    text.startsWith('Нет функции')
  )
}
