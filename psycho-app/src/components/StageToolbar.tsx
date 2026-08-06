import { getTest } from '../data'
import type { Specialist } from '../data'
import { printBlanks } from '../lib/blank'
import type { TestConfig } from '../types'

export function StageToolbar({
  test,
  theme,
  inputMode,
  packMode,
  packIds,
  specialist,
  onTogglePackMode,
  onToast,
  onToggleTheme,
  onToggleInputMode,
}: {
  test: TestConfig
  theme: 'light' | 'dark'
  inputMode: 'string' | 'radio'
  packMode: boolean
  packIds: Set<string>
  specialist: Specialist
  onTogglePackMode: () => void
  onToast: (msg: string) => void
  onToggleTheme: () => void
  onToggleInputMode: () => void
}) {
  return (
    <div className="stage-top no-print">
      <div>
        <div className="stage-kicker">{test.category}</div>
        <h1 className="stage-title">{test.label}</h1>
      </div>
      <div className="controls">
        <button
          type="button"
          className={`btn btn-secondary${packMode ? ' active-toggle' : ''}`}
          onClick={onTogglePackMode}
        >
          {packMode ? 'Пакет · готово' : 'Пакет'}
        </button>
        {packMode && (
          <button
            type="button"
            className="btn"
            disabled={packIds.size === 0}
            onClick={() => {
              const list = [...packIds].map((id) => getTest(id)!).filter(Boolean)
              printBlanks(list, specialist)
              onToast(`Печать: ${list.length}`)
            }}
          >
            Печать ({packIds.size})
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onToggleTheme}>
          {theme === 'dark' ? 'День' : 'Ночь'}
        </button>
        {test.kind !== 'text' && (
          <button type="button" className="btn btn-secondary" onClick={onToggleInputMode}>
            {inputMode === 'string' ? 'Строка' : 'Варианты'}
          </button>
        )}
      </div>
    </div>
  )
}
