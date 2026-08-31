import type { Level } from '../types'

/** Ключи шкал SCL-90-R (0-based индексы пунктов) */
export const SCL90_SCALE_KEYS: Record<string, number[]> = {
  som: [0, 3, 11, 26, 39, 41, 47, 48, 51, 52, 55, 57],
  oc: [2, 8, 9, 27, 37, 44, 45, 50, 54, 64],
  int: [5, 20, 33, 35, 36, 40, 60, 68, 72],
  dep: [4, 13, 14, 19, 21, 25, 28, 29, 30, 31, 53, 70, 78],
  anx: [1, 16, 22, 32, 38, 56, 71, 77, 79, 85],
  hos: [10, 23, 62, 66, 73, 80],
  phob: [12, 24, 46, 49, 69, 74, 81],
  par: [7, 17, 42, 67, 75, 82],
  psy: [6, 15, 34, 61, 76, 83, 84, 86, 87, 89],
}

export const SCL90_SCALE_META: Record<string, { code: string; name: string; short: string }> = {
  som: { code: 'SOM', name: 'Соматизация', short: 'телесные жалобы' },
  oc: { code: 'O-C', name: 'Обсессивно-компульсивные', short: 'навязчивости' },
  int: { code: 'INT', name: 'Межличностная сенситивность', short: 'чувствительность в общении' },
  dep: { code: 'DEP', name: 'Депрессия', short: 'депрессивные симптомы' },
  anx: { code: 'ANX', name: 'Тревога', short: 'тревожность' },
  hos: { code: 'HOS', name: 'Враждебность', short: 'раздражительность / гнев' },
  phob: { code: 'PHOB', name: 'Фобическая тревога', short: 'фобии' },
  par: { code: 'PAR', name: 'Параноидные идеи', short: 'подозрительность' },
  psy: { code: 'PSY', name: 'Психотизм', short: 'психотические проявления' },
}

/** Ориентиры по средним 0–4 (как в текущем кабинете): &lt;0.7 норма, 0.7–1.49 повышено, ≥1.5 высоко */
export const SCL90_CUT_MODERATE = 0.7
export const SCL90_CUT_HIGH = 1.5

export type Scl90Band = Level

export interface Scl90ScaleScore {
  id: string
  code: string
  name: string
  short: string
  mean: number
  level: Scl90Band
  flag: string
}

export interface Scl90Report {
  /** Ответы 0–4 после перевода с 1–5 */
  scores04: number[]
  gsi: number
  pst: number
  psdi: number
  level: Scl90Band
  /** Короткий вердикт для шапки результата */
  verdict: string
  /** Пояснение «есть проблемы / нет» */
  conclusion: string
  scales: Scl90ScaleScore[]
  elevated: Scl90ScaleScore[]
  high: Scl90ScaleScore[]
}

function bandOf(mean: number): Scl90Band {
  if (mean >= SCL90_CUT_HIGH) return 'high'
  if (mean >= SCL90_CUT_MODERATE) return 'moderate'
  return 'low'
}

function flagOf(level: Scl90Band): string {
  if (level === 'high') return 'высокий'
  if (level === 'moderate') return 'повышен'
  return 'в норме'
}

/**
 * Полный разбор SCL-90-R.
 * Ввод в приложении: 1–5 (русская адаптация) → внутри 0–4.
 */
export function computeScl90(raw1to5: number[]): Scl90Report {
  const scores04 = raw1to5.map((v) => v - 1)
  const scales: Scl90ScaleScore[] = Object.keys(SCL90_SCALE_KEYS).map((id) => {
    const idxs = SCL90_SCALE_KEYS[id]!
    const meta = SCL90_SCALE_META[id]!
    const sum = idxs.reduce((a, i) => a + (scores04[i] ?? 0), 0)
    const mean = sum / idxs.length
    const level = bandOf(mean)
    return {
      id,
      code: meta.code,
      name: meta.name,
      short: meta.short,
      mean,
      level,
      flag: flagOf(level),
    }
  })

  const totalSum = scores04.reduce((a, b) => a + b, 0)
  const gsi = totalSum / 90
  const positive = scores04.filter((s) => s > 0)
  const pst = positive.length
  const psdi = pst > 0 ? positive.reduce((a, b) => a + b, 0) / pst : 0
  const level = bandOf(gsi)
  const elevated = scales.filter((s) => s.level !== 'low')
  const high = scales.filter((s) => s.level === 'high')

  let verdict: string
  let conclusion: string
  if (level === 'low') {
    verdict = 'Существенных проблем не видно'
    conclusion =
      elevated.length === 0
        ? 'Общий индекс тяжести (GSI) в ориентировочной норме, отдельные шкалы не повышены. По текущему профилю клинически значимого дистресса не отмечается.'
        : `Общий индекс (GSI) в норме, но есть умеренные пики: ${elevated.map((s) => s.code).join(', ')}. Имеет смысл уточнить их на приёме, даже если общий фон спокойный.`
  } else if (level === 'moderate') {
    verdict = 'Есть признаки умеренного дистресса'
    conclusion =
      `GSI повышен — это уже сигнал, что проблемы есть и их стоит разбирать. ` +
      (elevated.length
        ? `Наиболее заметны: ${elevated.map((s) => `${s.code} (${s.short})`).join('; ')}.`
        : 'Профиль относительно ровный, без резких пиков по отдельным шкалам.')
  } else {
    verdict = 'Выраженный психологический дистресс'
    conclusion =
      `GSI высокий — клинически значимый уровень. Вероятны заметные трудности в самочувствии и/или функционировании. ` +
      (high.length
        ? `Особенно высокие шкалы: ${high.map((s) => `${s.code} (${s.short})`).join('; ')}.`
        : elevated.length
          ? `Повышены: ${elevated.map((s) => s.code).join(', ')}.`
          : '')
  }

  return {
    scores04,
    gsi,
    pst,
    psdi,
    level,
    verdict,
    conclusion,
    scales,
    elevated,
    high,
  }
}

/** Текст для сводки / копирования (компактнее UI-блока) */
export function formatScl90Summary(report: Scl90Report): string {
  const scaleBits = report.scales
    .map((s) => `${s.code} ${s.mean.toFixed(2)}${s.level === 'low' ? '' : s.level === 'high' ? '↑↑' : '↑'}`)
    .join('; ')
  const focus =
    report.elevated.length > 0
      ? ` Внимание: ${report.elevated.map((s) => s.code).join(', ')}.`
      : ''
  return (
    `SCL-90-R: ${report.verdict} (GSI ${report.gsi.toFixed(2)}, PST ${report.pst}/90, PSDI ${report.psdi.toFixed(2)}).` +
    `${focus} Шкалы: ${scaleBits}. Ориентиры: ср. <0,7 норма; ≥0,7 повышено; ≥1,5 высоко.`
  )
}

/** Полный текстовый вывод (если UI-компонент недоступен) */
export function formatScl90ResultText(report: Scl90Report): string {
  const lines = [
    `SCL-90-R — ${report.verdict}`,
    report.conclusion,
    '',
    `GSI (общий индекс тяжести): ${report.gsi.toFixed(2)} — ${flagOf(report.level)}`,
    `PST (число симптомов >0): ${report.pst}/90`,
    `PSDI (средняя интенсивность симптомов): ${report.psdi.toFixed(2)}`,
    '',
    'Шкалы (средние 0–4):',
    ...report.scales.map(
      (s) => `• ${s.code} ${s.name}: ${s.mean.toFixed(2)} — ${s.flag}`,
    ),
    '',
    'Ориентиры: <0,7 — норма; 0,7–1,49 — повышено; ≥1,5 — высоко. Не заменяет клинический диагноз.',
  ]
  return lines.join('\n')
}

/** Для TestConfig.score — текст сводки + level через calculateFromString */
export function scoreScl90(raw1to5: number[]): { text: string; level: Level } {
  const report = computeScl90(raw1to5)
  return { text: formatScl90Summary(report), level: report.level }
}
