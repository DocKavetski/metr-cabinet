import { categoryOrder, getTest } from '../data'
import type { GlobalResultItem } from '../types'

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

/** Текст сводки для копирования в заметки / карту */
export function formatSummary(items: GlobalResultItem[]): string {
  if (!items.length) return ''
  const date = new Date().toLocaleDateString('ru-RU')
  return byCategory(items, date)
}
