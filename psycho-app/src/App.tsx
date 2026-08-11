import { useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { GlobalSummary } from './components/GlobalSummary'
import { StageToolbar } from './components/StageToolbar'
import { SupportPhrases } from './components/SupportPhrases'
import { TestPanel } from './components/TestPanel'
import { allTests, getSpecialist, getTest } from './data'
import { usePersistedState } from './hooks/usePersistedState'
import { normalizeAnswer, pickRadioValue, tryCalc } from './lib/answers'
import { calculateFromString, missingRadioIndexes } from './lib/scoring'
import { expectedLength } from './lib/utils'
import './App.css'

export default function App() {
  const [state, setState] = usePersistedState()
  const [toast, setToast] = useState<string | null>(null)
  const [liveResult, setLiveResult] = useState<string>('Ожидание расчёта')
  const [liveLevel, setLiveLevel] = useState<string>('')
  const [packMode, setPackMode] = useState(false)
  const [packIds, setPackIds] = useState<Set<string>>(() => new Set())
  const [showMissing, setShowMissing] = useState(false)

  const test = getTest(state.currentTestId) || allTests[0]
  const answer = state.answers[test.id] || ''
  const len = expectedLength(test)
  const missing = missingRadioIndexes(answer, len)
  const specialist = getSpecialist(state.specialistId)
  const displayString = answer.replace(/x/g, '')

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

  return (
    <div className="app">
      <Sidebar
        currentId={test.id}
        onSelect={selectTest}
        packMode={packMode}
        packIds={packIds}
        onTogglePack={togglePack}
        answers={state.answers}
        specialistId={state.specialistId}
        onSpecialistChange={(id) => setState((s) => ({ ...s, specialistId: id }))}
      />
      <main className="main">
        <StageToolbar
          test={test}
          theme={state.theme}
          inputMode={state.inputMode}
          packMode={packMode}
          packIds={packIds}
          specialist={specialist}
          onTogglePackMode={() => setPackMode((v) => !v)}
          onToast={showToast}
          onToggleTheme={() =>
            setState((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))
          }
          onToggleInputMode={() =>
            setState((s) => ({
              ...s,
              inputMode: s.inputMode === 'string' ? 'radio' : 'string',
            }))
          }
        />

        <div className="stage-body">
          <div className="stage-grid">
            <div className="stage-primary">
              <TestPanel
                test={test}
                answer={answer}
                inputMode={state.inputMode}
                missing={missing}
                showMissing={showMissing}
                liveResult={liveResult}
                liveLevel={liveLevel}
                specialist={specialist}
                onAnswerChange={setAnswer}
                onPickRadio={pickRadio}
                onCalculate={runCalculate}
                onClear={() => {
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
                onToast={showToast}
              />

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

            {specialist.showSupportPhrases && <SupportPhrases />}
          </div>
        </div>
      </main>
      <div id="print-root" />
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
