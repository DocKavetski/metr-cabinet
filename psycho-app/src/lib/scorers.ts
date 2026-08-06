/** Специализированные ключи подсчёта — подключаются через TestConfig.score */

/**
 * SCL-90-R (Derogatis): ключи 0-based.
 * Ввод в программе 1–5 (русская адаптация) → переводим в 0–4 (ответ−1),
 * затем классические GSI / PST / PSDI и средние по шкалам.
 */
export function scoreScl90(raw1to5: number[]): string {
  const scores = raw1to5.map((v) => v - 1) // 0–4
  const sclKeys: Record<string, number[]> = {
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
  const names: Record<string, string> = {
    som: 'СОМ (соматизация)',
    oc: 'ОК (обсессивно-компульсивные)',
    int: 'МС (межличностная сенситивность)',
    dep: 'ДЕП (депрессия)',
    anx: 'ТР (тревога)',
    hos: 'ВР (враждебность)',
    phob: 'ФТ (фобическая тревога)',
    par: 'ПИ (параноидные идеи)',
    psy: 'ПС (психотизм)',
  }

  const lines: string[] = []
  for (const key of Object.keys(sclKeys)) {
    const idxs = sclKeys[key]!
    const sum = idxs.reduce((a, i) => a + (scores[i] ?? 0), 0)
    const avg = sum / idxs.length
    lines.push(`${names[key]}: ср. ${avg.toFixed(2)}`)
  }

  const totalSum = scores.reduce((a, b) => a + b, 0)
  const gsi = totalSum / 90
  const positive = scores.filter((s) => s > 0)
  const pst = positive.length
  const psdi = pst > 0 ? positive.reduce((a, b) => a + b, 0) / pst : 0

  let overall = 'ориентировочно низкий уровень дистресса'
  if (gsi >= 1.5) overall = 'ориентировочно высокий уровень дистресса'
  else if (gsi >= 0.7) overall = 'ориентировочно умеренный уровень дистресса'

  return (
    `SCL-90-R (шкала 0–4 после перевода с 1–5): GSI ${gsi.toFixed(2)}; PST ${pst}/90; PSDI ${psdi.toFixed(2)}. ` +
    `${overall}. ${lines.join('; ')}. Интерпретация GSI ориентировочная; опирайтесь на нормы вашей адаптации.`
  )
}

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
