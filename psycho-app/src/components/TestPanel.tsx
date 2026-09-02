import { RadioQuestions } from './RadioQuestions'
import { VisualResult } from './VisualResult'
import { getFreeBlank, originalBlankHref } from '../data'
import type { Specialist } from '../data'
import { isAnswerComplete } from '../lib/answers'
import { printBlank, printVisualResult } from '../lib/blank'
import { calculateFromString } from '../lib/scoring'
import { deriveVisualResult, isPendingResultText } from '../lib/visualResult'
import { expectedLength, getDigitRange, parseAnswerString } from '../lib/utils'
import type { TestConfig } from '../types'

export function TestPanel({
  test,
  answer,
  inputMode,
  missing,
  showMissing,
  liveResult,
  liveLevel,
  specialist,
  onAnswerChange,
  onPickRadio,
  onCalculate,
  onClear,
  onToast,
}: {
  test: TestConfig
  answer: string
  inputMode: 'string' | 'radio'
  missing: number[]
  showMissing: boolean
  liveResult: string
  liveLevel: string
  specialist: Specialist
  onAnswerChange: (value: string) => void
  onPickRadio: (index: number, value: number) => void
  onCalculate: () => void
  onClear: () => void
  onToast: (msg: string) => void
}) {
  const len = expectedLength(test)
  const range = getDigitRange(test)
  const freeBlank = getFreeBlank(test.id)
  const displayString = answer.replace(/x/g, '')
  const stringComplete = isAnswerComplete(test, answer)

  const visualModel = (() => {
    if (isPendingResultText(liveResult)) return null
    const calc = calculateFromString(test, test.kind === 'text' ? answer : displayString)
    if (!calc.ok) return null
    const nums =
      test.kind === 'text'
        ? undefined
        : parseAnswerString(displayString, len, range.min, range.max) || undefined
    return deriveVisualResult(test, calc, nums ?? undefined)
  })()

  return (
    <div className="test-panel" key={test.id}>
      <div className="test-meta">
        <span className="badge">{test.badge}</span>
        {freeBlank && <span className="badge badge-free">{freeBlank.badge}</span>}
      </div>
      <div className="test-desc" dangerouslySetInnerHTML={{ __html: test.desc }} />
      {freeBlank && (
        <p className="free-blank-note no-print">
          Печать — как в загруженном docx ({freeBlank.source}).
          {freeBlank.pdfFiles?.length ? (
            <>
              {' '}
              Эталон PDF:{' '}
              {freeBlank.pdfFiles.map((p, i) => (
                <span key={p.file}>
                  {i > 0 ? ' · ' : ''}
                  <a href={originalBlankHref(p.file)} target="_blank" rel="noreferrer">
                    {p.label}
                  </a>
                </span>
              ))}
            </>
          ) : null}
        </p>
      )}

      {(test.kind === 'text' || inputMode === 'string') && (
        <div className="instrument no-print">
          <div className="instrument-label">
            <span>{test.kind === 'text' ? 'Ввод балла' : 'Строка ответов'}</span>
            {test.kind !== 'text' && (
              <span>
                {displayString.length}/{len}
              </span>
            )}
          </div>
          <div className="string-input-group">
            <input
              type="text"
              value={test.kind === 'text' ? answer : displayString}
              placeholder={
                test.kind === 'text'
                  ? test.clinicianDomains?.length
                    ? 'Итог 0–30 или домены через пробел'
                    : 'Итоговый балл 0–30'
                  : `${len} цифр (${range.min}–${range.max})`
              }
              className={!displayString && test.kind !== 'text' ? '' : stringComplete ? 'valid' : 'error'}
              onChange={(e) => onAnswerChange(e.target.value)}
            />
            {test.kind !== 'text' && (
              <span className={`counter${stringComplete ? ' valid' : displayString ? ' error' : ''}`}>
                {displayString.length} / {len}
              </span>
            )}
          </div>
          {test.kind !== 'text' && len > 0 && (
            <div className="fill-bar" aria-hidden>
              <i style={{ width: `${Math.min(100, (displayString.length / len) * 100)}%` }} />
            </div>
          )}
        </div>
      )}

      {test.kind !== 'text' && inputMode === 'radio' && (
        <RadioQuestions
          test={test}
          answer={answer}
          onPick={onPickRadio}
          missing={missing}
          showMissing={showMissing || (missing.length > 0 && answer.length > 0)}
        />
      )}

      <div className="btn-row no-print">
        <button type="button" className="btn btn-secondary" onClick={onCalculate}>
          {stringComplete ? 'Пересчитать' : 'Рассчитать'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            printBlank(test, specialist)
            onToast('Диалог печати')
          }}
        >
          Печать бланка
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!visualModel}
          title={visualModel ? 'Печать рассчитанного результата' : 'Сначала заполните и рассчитайте тест'}
          onClick={() => {
            if (!visualModel) return
            printVisualResult(test.label, visualModel, specialist)
            onToast('Печать результата')
          }}
        >
          Печать результата
        </button>
        <button type="button" className="btn btn-danger" onClick={onClear}>
          Очистить
        </button>
      </div>

      {visualModel ? (
        <VisualResult model={visualModel} />
      ) : (
        <div className={`result-area level-${liveLevel || 'none'}`}>{liveResult}</div>
      )}
    </div>
  )
}
