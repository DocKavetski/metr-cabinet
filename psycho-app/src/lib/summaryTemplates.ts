import { categoryOrder, getTest } from '../data'
import type { GlobalResultItem } from '../types'

const CLINICAL_DESCRIPTOR =
  /^(?:умеренная|тяж[её]лая|субклиническая)\s+клиническая\b|^клинически\s+значим|^клиническая\s+сумма|^клинический\s+порог|^ниже\s+порога\s+клинической|^ориентир\s+клинически\s+значим/i

function isAdvisoryFragment(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (CLINICAL_DESCRIPTOR.test(t)) return false

  return (
    /^(?:рекомендуется|нужн[аоы](?:\s|$)|необходим[аоы]?|требует|обсудите|обсуждени[ея]|проведите|показана|очная\s+клиническая|клиническая\s+оценк[аи](?:\s|$|[,.;])|повод\s+для|при\s+наличии\s+сомнений|опросник\s+не\s+заменяет|повышенный\s+результат\s+требует)/i.test(
      t,
    ) ||
    /^[^.;]{0,48}(?:консультаци[яию]|специалистом|обследовани[ея]\s+сна)\.?$/i.test(t)
  )
}

/** Убирает из текста результата рекомендации обратиться к специалисту — только для сводки. */
export function sanitizeSummaryResult(text: string): string {
  let out = text.trim()
  if (!out) return out

  // Хвостовые предложения с рекомендациями
  for (;;) {
    const parts = out.split(/(?<=[.!?])\s+/)
    if (parts.length <= 1) break
    const last = parts[parts.length - 1]!
    if (!isAdvisoryFragment(last)) break
    out = parts.slice(0, -1).join(' ').trim()
  }

  // Части после «;»
  out = out
    .split(';')
    .map((p) => p.trim())
    .filter((p) => p && !isAdvisoryFragment(p))
    .join('; ')

  // Хвост после « — » (оставляем основной формат «N баллов — описание»)
  for (;;) {
    const idx = out.lastIndexOf(' — ')
    if (idx < 0) break
    const tail = out.slice(idx + 3).trim()
    if (!isAdvisoryFragment(tail)) break
    out = out.slice(0, idx).trim()
  }

  return out.replace(/\s+/g, ' ').replace(/\s+([,.;])/g, '$1').trim()
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
    for (const i of list) out += `- ${i.label}: ${sanitizeSummaryResult(i.result)}\n`
    out += '\n'
  }
  for (const [cat, list] of byCat) {
    if ((categoryOrder as readonly string[]).includes(cat)) continue
    out += `${cat}:\n`
    for (const i of list) out += `- ${i.label}: ${sanitizeSummaryResult(i.result)}\n`
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
