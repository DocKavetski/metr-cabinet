import type { Level } from '../types'

function sum(a: number[]): number {
  return a.reduce((s, v) => s + (v ?? 0), 0)
}

function sumIdx(a: number[], idxs: number[]): number {
  return idxs.reduce((s, i) => s + (a[i] ?? 0), 0)
}

/** EPDS: пункты 1,2,4 — как на бланке (0 сверху); 3,5–10 — reverse (верх = 3) */
export function scoreEpds(answers: number[]): { text: string; level: Level; score: number } {
  const reverse = new Set([2, 4, 5, 6, 7, 8, 9]) // 0-based: items 3,5-10
  let total = 0
  for (let i = 0; i < 10; i++) {
    const v = answers[i] ?? 0
    total += reverse.has(i) ? 3 - v : v
  }
  const item10 = reverse.has(9) ? 3 - (answers[9] ?? 0) : (answers[9] ?? 0)
  let label: string
  let level: Level
  if (total <= 9) {
    label = 'низкая вероятность депрессии'
    level = 'low'
  } else if (total <= 12) {
    label = 'возможная депрессия — повторить через 1–2 недели'
    level = 'moderate'
  } else {
    label = 'вероятная депрессия — нужна клиническая оценка'
    level = 'high'
  }
  const flag =
    item10 >= 1
      ? ' Внимание: пункт 10 (мысли о причинении себе вреда) > 0 — оценить безопасность до ухода с приёма.'
      : ''
  return {
    score: total,
    level,
    text: `EPDS: ${total}/30 — ${label}.${flag}`,
  }
}

/** PRAQ-R2: 10 пунктов 1–5; подшкалы FoGB / WaHC / CoA */
export function scorePraqR2(answers: number[]): { text: string; level: Level; score: number } {
  const total = sum(answers)
  const fogb = sumIdx(answers, [0, 1, 5]) // страх родов
  const wahc = sumIdx(answers, [3, 7, 8, 9]) // здоровье ребёнка
  const coa = sumIdx(answers, [2, 4, 6]) // внешность
  // ориентиры по диапазону (официального cut-off нет): низкий / средний / высокий тертиль 10–50
  let label: string
  let level: Level
  if (total <= 20) {
    label = 'относительно низкая беременность-специфическая тревога'
    level = 'low'
  } else if (total <= 35) {
    label = 'умеренная беременность-специфическая тревога'
    level = 'moderate'
  } else {
    label = 'высокая беременность-специфическая тревога'
    level = 'high'
  }
  return {
    score: total,
    level,
    text:
      `PRAQ-R2: ${total}/50 — ${label}. ` +
      `Подшкалы: страх родов ${fogb}/15; здоровье ребёнка ${wahc}/20; внешность ${coa}/15. ` +
      `Официального клинического порога нет — ориентир для разговора.`,
  }
}

/** W-DEQ-A: 33 пункта 0–5; reverse 2,3,6,7,8,11,12,15,19,20,24,25,27,31 (1-based) */
export function scoreWdeqA(answers: number[]): { text: string; level: Level; score: number } {
  const reverse1based = new Set([2, 3, 6, 7, 8, 11, 12, 15, 19, 20, 24, 25, 27, 31])
  let total = 0
  for (let i = 0; i < 33; i++) {
    const v = Math.max(0, Math.min(5, answers[i] ?? 0))
    total += reverse1based.has(i + 1) ? 5 - v : v
  }
  let label: string
  let level: Level
  if (total <= 37) {
    label = 'низкий страх родов'
    level = 'low'
  } else if (total <= 65) {
    label = 'умеренный страх родов'
    level = 'moderate'
  } else if (total <= 84) {
    label = 'высокий страх родов'
    level = 'moderate'
  } else {
    label = 'тяжёлый страх родов / токофобия (ориентир ≥85)'
    level = 'high'
  }
  return {
    score: total,
    level,
    text: `W-DEQ-A: ${total}/165 — ${label}. Порог ≥85 часто используют как скрининг клинически значимого страха родов.`,
  }
}

/** PASS: 31 пункт 0–3; cut-off ≥26 */
export function scorePass(answers: number[]): { text: string; level: Level; score: number } {
  const total = sum(answers)
  // подшкалы по Somerville (Excessive worry; Perfectionism/trauma; Social; Acute)
  const worry = sumIdx(answers, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) // 1–10
  const perfect = sumIdx(answers, [10, 11, 12, 13, 14, 15, 16, 17]) // 11–18
  const social = sumIdx(answers, [18, 19, 20, 21, 22]) // 19–23
  const acute = sumIdx(answers, [23, 24, 25, 26, 27, 28, 29, 30]) // 24–31
  let label: string
  let level: Level
  if (total <= 20) {
    label = 'минимальная тревога'
    level = 'low'
  } else if (total <= 41) {
    label = total >= 26 ? 'лёгкая–умеренная тревога (выше cut-off ≥26)' : 'лёгкая–умеренная тревога'
    level = 'moderate'
  } else {
    label = 'тяжёлая тревога'
    level = 'high'
  }
  return {
    score: total,
    level,
    text:
      `PASS: ${total}/93 — ${label}. ` +
      `Домены: беспокойство/страхи ${worry}; перфекционизм/контроль/травма ${perfect}; ` +
      `социальная тревога ${social}; острая тревога/адаптация ${acute}. ` +
      `Скрининговый порог ≥26 — повод углубить оценку.`,
  }
}

/** PBQ: 25 пунктов 0–5; reverse позитивных; cut-off total ≥26 / ≥40 */
export function scorePbq(answers: number[]): { text: string; level: Level; score: number } {
  // позитивные формулировки (0=никогда … 5=всегда) → reverse
  const positive = new Set([0, 3, 8, 12, 16, 18]) // 1,4,9,13,17,19 1-based
  const scored = answers.slice(0, 25).map((v, i) => {
    const x = Math.max(0, Math.min(5, v ?? 0))
    return positive.has(i) ? 5 - x : x
  })
  const total = sum(scored)
  const impaired = sumIdx(scored, [0, 1, 5, 6, 7, 8, 9, 11, 12, 14, 15, 16])
  const rejection = sumIdx(scored, [2, 3, 4, 10, 13, 20, 22])
  const anxiety = sumIdx(scored, [18, 19, 21, 24])
  const abuse = sumIdx(scored, [17, 23])
  let label: string
  let level: Level
  if (total < 26) {
    label = 'существенных нарушений связи не выявлено по скринингу'
    level = 'low'
  } else if (total < 40) {
    label = 'возможное нарушение бондинга (порог ≥26) — наблюдение и разбор'
    level = 'moderate'
  } else {
    label = 'выраженное нарушение бондинга (порог ≥40) — клиническая оценка'
    level = 'high'
  }
  const abuseFlag =
    abuse >= 2 ? ' Риск жестокого обращения (шкала ≥2) — срочно уточнить безопасность ребёнка.' : ''
  return {
    score: total,
    level: abuse >= 2 ? 'high' : level,
    text:
      `PBQ: ${total}/125 — ${label}. ` +
      `Подшкалы: нарушенный бондинг ${impaired}/60 (≥12?); отвержение/гнев ${rejection}/35 (≥17); ` +
      `тревога о ребёнке ${anxiety}/20 (≥10); риск жестокости ${abuse}/10 (≥2).` +
      abuseFlag,
  }
}

/**
 * City BiTS (симптомы): Q1–Q2 критерий A (0/1), Q3–Q22 симптомы 0–3 (сумма 0–60),
 * Q23–Q24 диссоциация 0–3, Q25–Q29 мета (кодируются 0–3 по бланку).
 */
export function scoreCityBits(answers: number[]): { text: string; level: Level; score: number } {
  const a1 = (answers[0] ?? 0) > 0 ? 1 : 0
  const a2 = (answers[1] ?? 0) > 0 ? 1 : 0
  const criterionA = a1 === 1 || a2 === 1
  const symptoms = answers.slice(2, 22).map((v) => Math.max(0, Math.min(3, v ?? 0)))
  const total = sum(symptoms)
  const reexp = sum(symptoms.slice(0, 5))
  const avoid = sum(symptoms.slice(5, 7))
  const mood = sum(symptoms.slice(7, 14))
  const hyper = sum(symptoms.slice(14, 20))
  const b = symptoms.slice(0, 5).some((v) => v >= 1)
  const c = symptoms.slice(5, 7).some((v) => v >= 1)
  const d = symptoms.slice(7, 14).filter((v) => v >= 1).length >= 2
  const e = symptoms.slice(14, 20).filter((v) => v >= 1).length >= 2
  const clusters = [b, c, d, e].filter(Boolean).length
  let label: string
  let level: Level
  if (total <= 10 && clusters <= 1) {
    label = 'низкая выраженность симптомов ПТСР, связанных с родами'
    level = 'low'
  } else if (total <= 28 || clusters <= 2) {
    label = 'умеренные симптомы — разбор опыта родов'
    level = 'moderate'
  } else {
    label = 'выраженные симптомы — оценка на ПТСР, связанный с родами'
    level = 'high'
  }
  if (criterionA && b && c && d && e) {
    label += '; по скринингу DSM-5 кластеры B–E закрыты при наличии критерия A (нужна клиническая верификация)'
    level = 'high'
  }
  return {
    score: total,
    level,
    text:
      `City BiTS: симптомы ${total}/60 — ${label}. ` +
      `Критерий A (угроза жизни/травма): ${criterionA ? 'да' : 'нет'}. ` +
      `Кластеры: повторное переживание ${reexp}/15; избегание ${avoid}/6; ` +
      `негативные мысли/настроение ${mood}/21; гипервозбуждение ${hyper}/18. ` +
      `Официального cut-off по сумме нет.`,
  }
}
