import { useMemo, useState } from 'react'
import {
  formatSummary,
  summaryTemplates,
  type SummaryTemplateId,
} from '../lib/summaryTemplates'
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
  const [templateId, setTemplateId] = useState<SummaryTemplateId>('all')
  const text = useMemo(() => formatSummary(items, templateId), [items, templateId])

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
      <div className="summary-templates" role="group" aria-label="Шаблон сводки">
        {summaryTemplates.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`summary-template-btn${templateId === t.id ? ' active' : ''}`}
            onClick={() => setTemplateId(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <textarea
        readOnly
        value={text}
        placeholder="Заполните шкалы — здесь появится текст для копирования в заметки."
      />
    </div>
  )
}
