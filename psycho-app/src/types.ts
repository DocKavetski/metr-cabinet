export type Level = 'low' | 'moderate' | 'high'

export type Option =
  | number
  | { value: number; label: string }

export interface InterpretationRule {
  min: number
  max: number
  label: string
  level: Level
}

/** Пункт с вариантами ответов (BDI, HADS и т.п.): индекс варианта = балл */
export interface BdiItem {
  title?: string
  options: string[]
}

export type TestKind =
  | 'likert'
  | 'bdi'
  | 'hads'
  | 'asq'
  | 'scl90'
  | 'text'

export interface ClinicianDomain {
  name: string
  max: number
  hint?: string
}

export interface TestConfig {
  id: string
  category: string
  label: string
  icon?: string
  badge: string
  desc: string
  kind: TestKind
  questions?: string[]
  options?: Option[]
  items?: BdiItem[]
  interpretation?: InterpretationRule[]
  score?: (answers: number[]) => string
  scoreText?: (value: string) => string
  digitMin?: number
  digitMax?: number
  printable?: boolean
  blankInstruction?: string
  /** Для кого бланк: пациент (по умолчанию) или специалист */
  blankAudience?: 'patient' | 'clinician'
  /** Домены для клинического протокола (MoCA/MMSE) */
  clinicianDomains?: ClinicianDomain[]
  /**
   * list — вопрос + кружки (по умолчанию)
   * matrix — таблица: варианты в шапке, ✕ в ячейке (удобно для длинных шкал)
   */
  blankLayout?: 'list' | 'matrix'
}

export interface GlobalResultItem {
  testId: string
  label: string
  result: string
}

export interface AppState {
  answers: Record<string, string>
  globalResults: GlobalResultItem[]
  inputMode: 'string' | 'radio'
  theme: 'dark' | 'light'
  currentTestId: string
  /** Специалист для печати на бланках */
  specialistId: string
}
