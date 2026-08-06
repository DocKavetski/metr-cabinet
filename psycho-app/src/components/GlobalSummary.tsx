import { useMemo } from 'react'
import { formatSummary } from '../lib/summaryTemplates'
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
  const text = useMemo(() => formatSummary(items), [items])

  return (
    <div className="global-result no-print">
      <h3>
        Сводка результатов
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onCopy(text)}
          disabled={!text.trim()}
        >
          Копировать
        </button>
        <button type="button" className="btn btn-danger" onClick={onClear}>
          Очистить всё
        </button>
      </h3>
      <textarea
        readOnly
        value={text}
        placeholder="Заполните шкалы — здесь появится текст для копирования в заметки."
      />
    </div>
  )
}
