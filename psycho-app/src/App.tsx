import { useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { DigitMapHint } from './components/DigitMapHint'
import { GlobalSummary } from './components/GlobalSummary'
import { RadioQuestions } from './components/RadioQuestions'
import { SupportPhrases } from './components/SupportPhrases'
import { allTests, getFreeBlank, getSpecialist, getTest, originalBlankHref } from './data'
import { usePersistedState } from './hooks/usePersistedState'
import { isAnswerComplete, normalizeAnswer, pickRadioValue, tryCalc } from './lib/answers'
import { printBlank, printBlanks } from './lib/blank'
import { calculateFromString, missingRadioIndexes } from './lib/scoring'
import { pushRecent } from './lib/storage'
import { expectedLength, getDigitRange } from './lib/utils'
import './App.css'

export default function App() {
  const [state, setState] = usePersistedState()
  const [toast, setToast] = useState<string | null>(null)
  const [liveResult, setLiveResult] = useState<string>('Ожидание расчёта')
  const [liveLevel, setLiveLevel] = useState<string>('')
  const [packMode, setPackMode] = useState(false)
  const [packIds, setPackIds] = useState<Set<string>>(() => new Set())
  const [showMissing, setShowMissing] = useState(false)
  const [cursorPos, setCursorPos] = useState(0)

  const test = getTest(state.currentTestId) || allTests[0]
  const answer = state.answers[test.id] || ''
  const len = expectedLength(test)
  const range = getDigitRange(test)
  const missing = missingRadioIndexes(answer, len)
  const specialist = getSpecialist(state.specialistId)
  const freeBlank = getFreeBlank(test.id)

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2500)
  }

  const upsertGlobal = (testId: string, label: string, resultText: string, ok: boolean) => {
    setState((s) => {
      const prev = s.globalResults.find((g) => g.testId === testId)
      if (ok) {
        if (prev?.result === resultText) return s
        const rest = s.globalResults.filter((g) => g.testId !== testId)
        rest.push({ testId, label, result: resultText })
        return { ...s, globalResults: rest }
      }
      if (!prev) return s
      return { ...s, globalResults: s.globalResults.filter((g) => g.testId !== testId) }
    })
  }

  const applyCalc = (raw: string) => {
    const res = calculateFromString(test, raw)
    setLiveResult(res.text)
    setLiveLevel(res.ok && res.level ? res.level : '')
    upsertGlobal(test.id, test.label, res.text, res.ok)
    showToast(res.ok ? 'Рассчитано' : 'Проверьте ввод')
    return res
  }

  useEffect(() => {
    setShowMissing(false)
    const res = tryCalc(test, answer)
    if (res?.ok) {
      setLiveResult(res.text)
      setLiveLevel(res.level || '')
      upsertGlobal(test.id, test.label, res.text, true)
      return
    }
    if (res && !res.ok) {
      setLiveResult(res.text)
      setLiveLevel('')
      upsertGlobal(test.id, test.label, '', false)
      return
    }
    const n = answer.replace(/x/g, '').replace(/\D/g, '').length
    if (test.kind !== 'text' && n > 0 && n < len) {
      setLiveResult(`Неполный ввод: ${n} из ${len}. Расчёт после полной строки.`)
    } else if (missing.length && state.inputMode === 'radio' && /x|\d/.test(answer)) {
      setLiveResult(`Не все ответы: заполнено ${len - missing.length}/${len}.`)
    } else {
      setLiveResult('Ожидание расчёта')
    }
    setLiveLevel('')
    upsertGlobal(test.id, test.label, '', false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test.id, answer, state.inputMode, len])

  const selectTest = (id: string) => {
    setState((s) => ({
      ...s,
      currentTestId: id,
      recentIds: pushRecent(s.recentIds, id),
    }))
  }

  const setAnswer = (v: string) => {
    const next = normalizeAnswer(test, v)
    setState((s) => ({ ...s, answers: { ...s.answers, [test.id]: next } }))
  }

  const pickRadio = (index: number, value: number) => {
    const next = pickRadioValue(answer, len, index, value)
    setState((s) => ({ ...s, answers: { ...s.answers, [test.id]: next } }))
  }

  const displayString = answer.replace(/x/g, '')
  const stringComplete = isAnswerComplete(test, answer)

  const runCalculate = () => {
    if (test.kind === 'text') {
      applyCalc(answer)
      return
    }
    if (state.inputMode === 'radio' || /x/.test(answer)) {
      if (missing.length) {
        setShowMissing(true)
        setLiveResult(
          `Не все ответы: пропущено ${missing.length} (пункты ${missing.map((i) => i + 1).join(', ')}).`,
        )
        showToast('Отметьте пропущенные пункты')
        return
      }
      applyCalc(answer.replace(/x/g, ''))
      return
    }
    if (displayString.length < len) {
      setLiveResult(`Неполный ввод: ${displayString.length} из ${len}.`)
      showToast('Нужна полная строка')
      return
    }
    applyCalc(displayString)
  }

  const togglePack = (id: string) => {
    setPackIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleFavorite = (id: string) => {
    setState((s) => {
      const has = s.favoriteIds.includes(id)
      return {
        ...s,
        favoriteIds: has ? s.favoriteIds.filter((x) => x !== id) : [...s.favoriteIds, id],
      }
    })
  }

  return (
    <div className="app">
      <Sidebar
        currentId={test.id}
        onSelect={selectTest}
        packMode={packMode}
        packIds={packIds}
        onTogglePack={togglePack}
        favoriteIds={state.favoriteIds}
        onToggleFavorite={toggleFavorite}
        recentIds={state.recentIds}
        answers={state.answers}
        specialistId={state.specialistId}
        onSpecialistChange={(id) => setState((s) => ({ ...s, specialistId: id }))}
      />
      <main className="main">
        <div className="stage-top no-print">
          <div>
            <div className="stage-kicker">{test.category}</div>
            <h1 className="stage-title">{test.label}</h1>
          </div>
          <div className="controls">
            <button
              type="button"
              className={`btn btn-secondary${packMode ? ' active-toggle' : ''}`}
              onClick={() => setPackMode((v) => !v)}
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
                  showToast(`Печать: ${list.length}`)
                }}
              >
                Печать ({packIds.size})
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setState((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))}
            >
              {state.theme === 'dark' ? 'День' : 'Ночь'}
            </button>
            {test.kind !== 'text' && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    inputMode: s.inputMode === 'string' ? 'radio' : 'string',
                  }))
                }
              >
                {state.inputMode === 'string' ? 'Строка' : 'Варианты'}
              </button>
            )}
          </div>
        </div>

        <div className="stage-body">
          <div className="stage-grid">
            <div className="stage-primary">
              <div className="test-panel" key={test.id}>
                <div className="test-meta">
                  <span className="badge">{test.badge}</span>
                  {freeBlank && <span className="badge badge-free">{freeBlank.badge}</span>}
                </div>
                <div className="test-desc" dangerouslySetInnerHTML={{ __html: test.desc }} />
                {freeBlank && (
                  <p className="free-blank-note no-print">
                    Печать — официальная свободная форма ({freeBlank.source}), внизу бланка —
                    выбранный специалист.
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

                {(test.kind === 'text' || state.inputMode === 'string') && (
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
                        className={
                          !displayString && test.kind !== 'text' ? '' : stringComplete ? 'valid' : 'error'
                        }
                        onChange={(e) => {
                          setAnswer(e.target.value)
                          setCursorPos(e.target.selectionStart ?? e.target.value.replace(/\D/g, '').length)
                        }}
                        onSelect={(e) => {
                          const el = e.target as HTMLInputElement
                          const before = el.value.slice(0, el.selectionStart ?? 0).replace(/\D/g, '')
                          setCursorPos(before.length)
                        }}
                        onClick={(e) => {
                          const el = e.target as HTMLInputElement
                          const before = el.value.slice(0, el.selectionStart ?? 0).replace(/\D/g, '')
                          setCursorPos(before.length)
                        }}
                        onKeyUp={(e) => {
                          const el = e.target as HTMLInputElement
                          const before = el.value.slice(0, el.selectionStart ?? 0).replace(/\D/g, '')
                          setCursorPos(before.length)
                        }}
                      />
                      {test.kind !== 'text' && (
                        <span
                          className={`counter${stringComplete ? ' valid' : displayString ? ' error' : ''}`}
                        >
                          {displayString.length} / {len}
                        </span>
                      )}
                    </div>
                    {test.kind !== 'text' && len > 0 && (
                      <div className="fill-bar" aria-hidden>
                        <i style={{ width: `${Math.min(100, (displayString.length / len) * 100)}%` }} />
                      </div>
                    )}
                    {test.kind !== 'text' && (
                      <DigitMapHint digits={displayString} len={len} cursorPos={cursorPos} />
                    )}
                  </div>
                )}

                {test.kind !== 'text' && state.inputMode === 'radio' && (
                  <RadioQuestions
                    test={test}
                    answer={answer}
                    onPick={pickRadio}
                    missing={missing}
                    showMissing={showMissing || (missing.length > 0 && answer.length > 0)}
                  />
                )}

                <div className="btn-row no-print">
                  <button type="button" className="btn btn-secondary" onClick={runCalculate}>
                    {stringComplete ? 'Пересчитать' : 'Рассчитать'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      printBlank(test, specialist)
                      showToast('Диалог печати')
                    }}
                  >
                    Печать бланка
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      setState((s) => {
                        const answers = { ...s.answers }
                        delete answers[test.id]
                        return {
                          ...s,
                          answers,
                          globalResults: s.globalResults.filter((g) => g.testId !== test.id),
                        }
                      })
                      setLiveResult('Ожидание расчёта')
                      setShowMissing(false)
                      showToast('Тест очищен')
                    }}
                  >
                    Очистить
                  </button>
                </div>

                <div className={`result-area level-${liveLevel || 'none'}`}>{liveResult}</div>
              </div>

              <GlobalSummary
                items={state.globalResults}
                onCopy={(text) => {
                  if (!text) return
                  navigator.clipboard.writeText(text).then(
                    () => showToast('Скопировано'),
                    () => showToast('Не удалось скопировать'),
                  )
                }}
                onClear={() => {
                  setState((s) => ({ ...s, answers: {}, globalResults: [] }))
                  setLiveResult('Ожидание расчёта')
                  showToast('Всё очищено')
                }}
              />
            </div>

            <SupportPhrases />
          </div>
        </div>
      </main>
      <div id="print-root" />
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
