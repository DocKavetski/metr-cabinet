import { useMemo } from 'react'
import { categoryOrder, getTest } from '../data'
import type { GlobalResultItem } from '../types'

export function GlobalSummary({
  items,
  onCopy,
  onClear,
}: {
  items: GlobalResultItem[]
  onCopy: (text: string) => void
  onClear: () => void
}) {
  const text = useMemo(() => {
    if (!items.length) return ''
    const date = new Date().toLocaleDateString('ru-RU')
    const byCat = new Map<string, GlobalResultItem[]>()
    for (const item of items) {
      const cat = getTest(item.testId)?.category || 'Прочее'
      if (!byCat.has(cat)) byCat.set(cat, [])
      byCat.get(cat)!.push(item)
    }
    let out = `${date}\n\n`
    for (const cat of categoryOrder) {
      const list = byCat.get(cat)
      if (!list?.length) continue
      out += `${cat}:\n`
      for (const i of list) out += `- ${i.label}: ${i.result}\n`
      out += '\n'
    }
    return out.trim()
  }, [items])

  return (
    <div className="global-result no-print">
      <h3>
        Сводка результатов
        <button type="button" className="btn btn-secondary" onClick={() => onCopy(text)}>
          Копировать
        </button>
        <button type="button" className="btn btn-danger" onClick={onClear}>
          Очистить всё
        </button>
      </h3>
      <textarea readOnly value={text} placeholder="Здесь появятся результаты..." />
    </div>
  )
}
