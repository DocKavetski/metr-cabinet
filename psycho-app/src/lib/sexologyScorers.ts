/** MSQ (Janda / Snell): 30 пунктов, Likert 1–5; балл подшкалы = сумма (ответ−1), страх: пункты 23 и 29 обратные. */
interface MsqSubscale {
  name: string
  items: number[]
  reverse?: Set<number>
}

const MSQ_SUBSCALES: MsqSubscale[] = [
  { name: 'Внутренний контроль', items: [0, 6, 12, 18, 24] },
  { name: 'Мотивация', items: [1, 7, 13, 19, 25] },
  { name: 'Обеспокоенность', items: [2, 8, 14, 20, 26] },
  { name: 'Внешний контроль', items: [3, 9, 15, 21, 27] },
  { name: 'Страх', items: [4, 10, 16, 22, 28], reverse: new Set([22, 28]) },
  { name: 'Удовлетворённость', items: [5, 11, 17, 23, 29] },
]

function msqItemScore(answer: number, reverse: boolean): number {
  const a = Math.min(5, Math.max(1, answer))
  return reverse ? 5 - a : a - 1
}

function msqLevel(score: number): string {
  if (score >= 16) return 'высокий'
  if (score >= 9) return 'средний'
  return 'низкий'
}

export function scoreMsq(a: number[]): string {
  const parts = MSQ_SUBSCALES.map(({ name, items, reverse }) => {
    const rev = reverse ?? new Set<number>()
    const score = items.reduce((sum, i) => sum + msqItemScore(a[i] ?? 1, rev.has(i)), 0)
    return `${name} ${score}/20 (${msqLevel(score)})`
  })
  return `MSQ: ${parts.join('; ')}.`
}

/** Berg-Cross: 1 = полностью удовлетворён, 5 = полностью не удовлетворён; % = (5−ответ)/4×100. */
function bergCrossPct(a: number[]): number {
  if (!a.length) return 0
  const sum = a.reduce((s, v) => s + (5 - v) / 4, 0)
  return Math.round((sum / a.length) * 100)
}

export function scoreBergCross(a: number[]): string {
  const sex = bergCrossPct(a.slice(0, 8))
  const partner = bergCrossPct(a.slice(8, 13))
  const relationship = bergCrossPct(a.slice(13, 20))
  const overall = bergCrossPct(a)
  return (
    `Берг-Кросс: общая удовлетворённость ${overall}%; ` +
    `секс ${sex}%; партнёр ${partner}%; отношения ${relationship}%.`
  )
}

export interface SexProfileSubscale {
  name: string
  max: number
  from: number
  to: number
}

export const SEX_PROFILE_SUBSCALES: SexProfileSubscale[] = [
  { name: 'Осведомлённость', max: 20, from: 0, to: 20 },
  { name: 'Влечение', max: 20, from: 20, to: 30 },
  { name: 'Благополучие', max: 10, from: 30, to: 40 },
  { name: 'Удовлетворённость', max: 10, from: 40, to: 50 },
  { name: 'Чувственность', max: 10, from: 50, to: 60 },
  { name: 'Общительность', max: 10, from: 60, to: 70 },
  { name: 'Уверенность', max: 10, from: 70, to: 80 },
  { name: 'Техника', max: 10, from: 80, to: 90 },
  { name: 'Широта взглядов', max: 10, from: 90, to: 100 },
]

function sexProfileLevel(score: number, max: number): string {
  const high = max === 20 ? 16 : 8
  const mid = max === 20 ? 9 : 5
  if (score >= high) return 'высокий'
  if (score >= mid) return 'средний'
  return 'низкий'
}

export function scoreSexProfile(a: number[], label: string): string {
  const parts = SEX_PROFILE_SUBSCALES.map(({ name, max, from, to }) => {
    const score = a.slice(from, to).reduce((s, v) => s + v, 0)
    return `${name} ${score}/${max} (${sexProfileLevel(score, max)})`
  })
  return `${label}: ${parts.join('; ')}.`
}
