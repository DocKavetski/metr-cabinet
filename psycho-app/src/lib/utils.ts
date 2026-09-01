import type { Option, TestConfig } from '../types'

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function optionValue(opt: Option): number {
  return typeof opt === 'object' ? opt.value : opt
}

export function optionLabel(opt: Option): string {
  return typeof opt === 'object' ? opt.label : String(opt)
}

export function getDigitRange(test: TestConfig): { min: number; max: number } {
  if (test.digitMin !== undefined && test.digitMax !== undefined) {
    return { min: test.digitMin, max: test.digitMax }
  }
  if (test.kind === 'bdi' || test.kind === 'hads') return { min: 0, max: 3 }
  if (test.kind === 'scl90') return { min: 1, max: 5 }
  if (test.kind === 'asq') return { min: 0, max: 1 }
  if (test.options?.length) {
    const vals = test.options.map(optionValue)
    return { min: Math.min(...vals), max: Math.max(...vals) }
  }
  return { min: 0, max: 9 }
}

export function expectedLength(test: TestConfig): number {
  if (test.items?.length) return test.items.length
  if (test.kind === 'bdi') return test.items?.length ?? 21
  if (test.kind === 'hads') return test.items?.length || test.questions?.length || 14
  if (test.kind === 'asq') return 5
  if (test.kind === 'scl90') return test.questions?.length || 90
  if (test.kind === 'text') return 0
  return test.questions?.length ?? 0
}

export function todayRu(): string {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy} г.`
}

/** «12 августа 2026 г.» — как в официальных бланках */
export function todayRuLong(): string {
  const s = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
  return `${s} г.`
}

export function parseAnswerString(raw: string, len: number, min: number, max: number): number[] | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length !== len) return null
  const nums = digits.split('').map(Number)
  if (nums.some((n) => n < min || n > max || Number.isNaN(n))) return null
  return nums
}
