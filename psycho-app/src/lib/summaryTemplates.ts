import { categoryOrder, getBattery, getTest, screeningBatteries } from '../data'
import type { GlobalResultItem } from '../types'

export type SummaryTemplateId = 'all' | 'intake' | 'adhd' | 'asd'

export interface SummaryTemplate {
  id: SummaryTemplateId
  label: string
}

export const summaryTemplates: SummaryTemplate[] = [
  { id: 'all', label: 'Всё по категориям' },
  { id: 'intake', label: 'Первичный приём' },
  { id: 'adhd', label: 'Скрининг СДВГ' },
  { id: 'asd', label: 'Скрининг аутизма' },
]

const SHORT: Record<string, string> = {
  phq9: 'PHQ-9',
  gad7: 'GAD-7',
  asq: 'ASQ',
  isi: 'ISI',
  audit: 'AUDIT',
  asrs: 'ASRS',
  diva5: 'DIVA-5',
  aq10: 'AQ-10',
  aq50: 'AQ-50',
  raadsr: 'RAADS-R',
  catq: 'CAT-Q',
}

function displayName(testId: string, fallbackLabel: string): string {
  return SHORT[testId] ?? fallbackLabel.split('—')[0]?.trim() ?? fallbackLabel
}

function byCategory(items: GlobalResultItem[], date: string): string {
  const byCat = new Map<string, GlobalResultItem[]>()
  for (const item of items) {
    const cat = getTest(item.testId)?.category || 'Прочее'
    if (!byCat.has(cat)) byCat.set(cat, [])
    byCat.get(cat)!.push(item)
  }
  let out = `${date}\n`
  for (const cat of categoryOrder) {
    const list = byCat.get(cat)
    if (!list?.length) continue
    out += `${cat}:\n`
    for (const i of list) out += `- ${i.label}: ${i.result}\n`
    out += '\n'
  }
  for (const [cat, list] of byCat) {
    if ((categoryOrder as readonly string[]).includes(cat)) continue
    out += `${cat}:\n`
    for (const i of list) out += `- ${i.label}: ${i.result}\n`
    out += '\n'
  }
  return out.trim()
}

function batteryBlock(
  title: string,
  batteryId: string,
  items: GlobalResultItem[],
  date: string,
): string {
  const battery = getBattery(batteryId) ?? screeningBatteries.find((b) => b.id === batteryId)
  const ids = battery?.testIds ?? []
  const map = new Map(items.map((i) => [i.testId, i]))

  let out = `${date}\n${title}\n\n`
  for (const id of ids) {
    const item = map.get(id)
    const label = displayName(id, getTest(id)?.label ?? id)
    out += item ? `${label}: ${item.result}\n` : `${label}: — не заполнен\n`
  }

  const extra = items.filter((i) => !ids.includes(i.testId))
  if (extra.length) {
    out += `\nДополнительно:\n`
    for (const i of extra) out += `- ${displayName(i.testId, i.label)}: ${i.result}\n`
  }

  out += `\nКомментарий: `
  return out.trimEnd()
}

/** Текст сводки для копирования в заметки / карту */
export function formatSummary(
  items: GlobalResultItem[],
  templateId: SummaryTemplateId = 'all',
): string {
  if (!items.length && templateId === 'all') return ''
  const date = new Date().toLocaleDateString('ru-RU')
  if (templateId === 'intake') return batteryBlock('Первичный скрининг', 'intake', items, date)
  if (templateId === 'adhd') return batteryBlock('Скрининг СДВГ', 'adhd', items, date)
  if (templateId === 'asd') return batteryBlock('Скрининг аутизма / РАС', 'asd', items, date)
  return byCategory(items, date)
}

export function defaultTemplateForBattery(batteryId: string | null | undefined): SummaryTemplateId {
  if (batteryId === 'intake' || batteryId === 'adhd' || batteryId === 'asd') return batteryId
  return 'all'
}
