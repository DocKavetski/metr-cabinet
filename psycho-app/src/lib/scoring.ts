import type { TestConfig } from '../types'
import { expectedLength, getDigitRange, parseAnswerString } from './utils'

export interface CalcOk {
  ok: true
  text: string
  score?: number
  level?: 'low' | 'moderate' | 'high'
}

export interface CalcErr {
  ok: false
  text: string
}

export type CalcResult = CalcOk | CalcErr

export {
  scoreAq10,
  scoreAq50,
  scoreAsq,
  scoreFsfi,
  scoreScl90,
} from './scorers'

function interpret(test: TestConfig, total: number): CalcOk {
  let label = ''
  let level: CalcOk['level']
  if (test.interpretation) {
    for (const rule of test.interpretation) {
      if (total >= rule.min && total <= rule.max) {
        label = rule.label
        level = rule.level
        break
      }
    }
  }
  const text = label ? `${total} баллов — ${label}` : `${total} баллов`
  return { ok: true, text, score: total, level }
}

export function calculateFromString(test: TestConfig, raw: string): CalcResult {
  if (test.kind === 'text') {
    if (!test.scoreText) return { ok: false, text: 'Нет функции подсчёта' }
    const text = test.scoreText(raw.trim())
    const bad = text.startsWith('Введите')
    return bad ? { ok: false, text } : { ok: true, text }
  }

  const len = expectedLength(test)
  const { min, max } = getDigitRange(test)
  const cleaned = raw.replace(/\D/g, '')
  if (cleaned.length < len) {
    return {
      ok: false,
      text: `Неполный ввод: ${cleaned.length} из ${len} ответов. Расчёт только при полной строке.`,
    }
  }
  const nums = parseAnswerString(cleaned.slice(0, len), len, min, max)
  if (!nums) {
    return {
      ok: false,
      text: `Цифры должны быть от ${min} до ${max}. Сейчас длина ${cleaned.length}.`,
    }
  }

  if (test.score) {
    const out = test.score(nums)
    if (typeof out === 'object' && out && 'text' in out) {
      return { ok: true, text: out.text, level: out.level, score: out.score }
    }
    const text = out
    const asNum = Number(text)
    if (Number.isFinite(asNum) && String(asNum) === text.trim() && test.interpretation) {
      return interpret(test, asNum)
    }
    return { ok: true, text }
  }

  const total = nums.reduce((a, b) => a + b, 0)
  return interpret(test, total)
}

export function missingRadioIndexes(answer: string, len: number): number[] {
  const missing: number[] = []
  for (let i = 0; i < len; i++) {
    const ch = answer[i]
    if (ch === undefined || ch === 'x' || !/\d/.test(ch)) missing.push(i)
  }
  return missing
}
