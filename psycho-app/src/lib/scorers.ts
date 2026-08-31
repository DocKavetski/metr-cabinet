/** Специализированные ключи подсчёта — подключаются через TestConfig.score */

/** SCL-90-R — отдельный модуль с вердиктом и разбором шкал */
export { scoreScl90 } from './scl90'

export function scoreAsq(answers: number[]): string {
  const screenYes = answers.slice(0, 4).filter((v) => v === 1).length
  const acuteYes = answers[4] === 1 ? 1 : 0
  const totalYes = screenYes + acuteYes
  return (
    `ASQ: ответов «Да» — ${totalYes}/5 ` +
    `(скрининг ${screenYes}/4, острота ${acuteYes}/1).`
  )
}

/** Официальный FSFI (Rosen): домены × коэффициенты, порог дисфункции ≤ 26.55 */
export function scoreFsfi(a: number[]): string {
  const sum = (from: number, to: number) => a.slice(from, to).reduce((x, y) => x + y, 0)
  const desire = sum(0, 2) * 0.6
  const arousal = sum(2, 6) * 0.3
  const lubrication = sum(6, 10) * 0.3
  const orgasm = sum(10, 13) * 0.4
  const satisfaction = sum(13, 16) * 0.4
  const pain = sum(16, 19) * 0.4
  const total = desire + arousal + lubrication + orgasm + satisfaction + pain
  const domains = [
    ['Желание', desire],
    ['Возбуждение', arousal],
    ['Лубрикация', lubrication],
    ['Оргазм', orgasm],
    ['Удовлетворённость', satisfaction],
    ['Боль', pain],
  ] as const
  const domainText = domains.map(([n, v]) => `${n} ${v.toFixed(1)}`).join('; ')
  const flag =
    total <= 26.55
      ? 'итоговый балл ≤ 26,55 — клинический порог сексуальной дисфункции (FSFI)'
      : 'итоговый балл > 26,55 — выше порога дисфункции'
  return `FSFI всего ${total.toFixed(2)} (макс. 36,0): ${domainText}. ${flag}.`
}

/**
 * AQ-50 (Baron-Cohen): при ответе Да=1 / Нет=0.
 * Балл за «Да» на agree-пунктах и за «Нет» на disagree-пунктах.
 */
export function scoreAq50(answers: number[]): number {
  const agreeKeyed = new Set([
    2, 4, 5, 6, 7, 9, 12, 13, 16, 18, 19, 20, 21, 22, 23, 26, 33, 35, 39, 41, 42, 43, 45, 46,
  ])
  let total = 0
  for (let i = 0; i < 50; i++) {
    const item = i + 1
    const ans = answers[i] ?? 0
    if (agreeKeyed.has(item)) total += ans === 1 ? 1 : 0
    else total += ans === 0 ? 1 : 0
  }
  return total
}

/** AQ-10: баллы за согласие на 1,7,8,10 и за несогласие на остальных */
export function scoreAq10(answers: number[]): number {
  const agreeIdx = new Set([0, 6, 7, 9])
  let total = 0
  for (let i = 0; i < 10; i++) {
    const ans = answers[i] ?? 0
    if (agreeIdx.has(i)) total += ans === 1 ? 1 : 0
    else total += ans === 0 ? 1 : 0
  }
  return total
}

/**
 * PDQ-20 (Sullivan et al. / MSQLI): 4 подшкалы по 5 пунктов (0–20) + итог 0–80.
 * Индексы 0-based: внимание 1,5,9,13,17; ретроспективная 2,6,10,14,18;
 * проспективная 3,7,11,15,19; планирование 4,8,12,16,20.
 */
export function scorePdq20(a: number[]): string {
  const sumIdx = (idxs: number[]) => idxs.reduce((s, i) => s + (a[i] ?? 0), 0)
  const attention = sumIdx([0, 4, 8, 12, 16])
  const retrospective = sumIdx([1, 5, 9, 13, 17])
  const prospective = sumIdx([2, 6, 10, 14, 18])
  const planning = sumIdx([3, 7, 11, 15, 19])
  const total = attention + retrospective + prospective + planning

  let label = 'низкая выраженность воспринимаемого дефицита'
  if (total >= 35) label = 'ориентир клинически значимого воспринимаемого дефицита (≥35)'
  else if (total >= 24) label = 'высокая выраженность воспринимаемого дефицита'
  else if (total >= 18) label = 'умеренно-высокая выраженность'
  else if (total >= 12) label = 'умеренная выраженность'

  return (
    `PDQ-20: итог ${total}/80 — ${label}. ` +
    `Подшкалы (0–20): концентрация внимания ${attention}; ` +
    `ретроспективная память ${retrospective}; ` +
    `проспективная память ${prospective}; ` +
    `планирование и организация ${planning}. ` +
    `Чем выше балл, тем более выражены субъективные когнитивные трудности; ` +
    `опросник не заменяет нейропсихологическое обследование.`
  )
}
