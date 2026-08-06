import { expectedLength, optionLabel, optionValue } from '../lib/utils'
import type { TestConfig } from '../types'

export function RadioQuestions({
  test,
  answer,
  onPick,
  missing,
  showMissing,
}: {
  test: TestConfig
  answer: string
  onPick: (index: number, value: number) => void
  missing: number[]
  showMissing: boolean
}) {
  const get = (i: number) => {
    const ch = answer[i]
    if (ch === undefined || ch === 'x' || !/\d/.test(ch)) return null
    return Number(ch)
  }
  const miss = new Set(missing)

  if (test.items?.length) {
    return (
      <div className="items bdi-items">
        {test.items.map((item, idx) => (
          <div
            key={idx}
            className={`bdi-item${showMissing && miss.has(idx) ? ' missing' : ''}`}
          >
            <div className="bdi-item-head">
              <span className="q-num">{idx + 1}.</span>
              {item.title ? <span className="bdi-item-title">{item.title}</span> : null}
              {showMissing && miss.has(idx) && <span className="miss-tag">нет ответа</span>}
            </div>
            <div className="bdi-options">
              {item.options.map((text, v) => (
                <label key={v} className={get(idx) === v ? 'selected' : ''}>
                  <input
                    type="radio"
                    name={`q_${test.id}_${idx}`}
                    checked={get(idx) === v}
                    onChange={() => onPick(idx, v)}
                  />
                  <span className="bdi-score">{v}</span>
                  <span className="bdi-text">{text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const len = expectedLength(test)
  const questions = test.questions || []
  const opts = test.kind === 'asq' ? [0, 1] : test.options || [0, 1, 2, 3]

  return (
    <div className="items scale-items">
      {questions.slice(0, len).map((q, idx) => (
        <div
          key={idx}
          className={`scale-item${showMissing && miss.has(idx) ? ' missing' : ''}`}
        >
          <div className="scale-item-q">
            <span className="q-num">{idx + 1}.</span>
            <span className="scale-item-text">{q}</span>
            {showMissing && miss.has(idx) && <span className="miss-tag">нет ответа</span>}
          </div>
          <div className="scale-item-opts">
            {opts.map((opt) => {
              const val = typeof opt === 'number' ? opt : optionValue(opt)
              const label = typeof opt === 'number' ? String(opt) : optionLabel(opt)
              return (
                <label key={`${idx}-${val}`} className={get(idx) === val ? 'selected' : ''}>
                  <input
                    type="radio"
                    name={`q_${test.id}_${idx}`}
                    checked={get(idx) === val}
                    onChange={() => onPick(idx, val)}
                  />
                  <span>{label}</span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
