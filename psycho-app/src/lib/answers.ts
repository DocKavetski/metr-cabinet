import { calculateFromString, type CalcResult } from './scoring'
import { expectedLength } from './utils'
import type { TestConfig } from '../types'

/** Убирает пробелы, запятые, табы — остаёт только цифры */
export function normalizeAnswer(test: TestConfig, raw: string): string {
  if (test.kind === 'text') return raw.trim()
  return raw.replace(/\D/g, '').slice(0, expectedLength(test))
}

/** Расчёт только при полном валидном ответе; иначе null */
export function tryCalc(test: TestConfig, answer: string): CalcResult | null {
  if (test.kind === 'text') {
    if (!answer.trim()) return null
    return calculateFromString(test, answer)
  }
  if (/x/.test(answer)) return null
  const cleaned = answer.replace(/\D/g, '')
  if (cleaned.length !== expectedLength(test)) return null
  return calculateFromString(test, cleaned)
}

export function pickRadioValue(answer: string, len: number, index: number, value: number): string {
  const arr: Array<string | null> = []
  for (let i = 0; i < len; i++) {
    const ch = answer[i]
    arr.push(ch !== undefined && /\d/.test(ch) ? ch : null)
  }
  arr[index] = String(value)
  return arr.every((c) => c !== null) ? arr.join('') : arr.map((c) => c ?? 'x').join('')
}

export function isAnswerComplete(test: TestConfig, answer: string): boolean {
  if (test.kind === 'text') return answer.trim().length > 0
  if (/x/.test(answer)) return false
  return answer.replace(/\D/g, '').length === expectedLength(test)
}
