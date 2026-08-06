import type { TestConfig } from '../types'

/** Набор шкал для шаблона сводки */
export interface ScreeningBattery {
  id: string
  label: string
  short: string
  desc: string
  /** Порядок шкал в батарее */
  testIds: string[]
}

export const screeningBatteries: ScreeningBattery[] = [
  {
    id: 'intake',
    label: 'Первичный приём',
    short: 'Приём',
    desc: 'PHQ-9, GAD-7, ASQ, ISI, AUDIT — быстрый скрининг на первичке.',
    testIds: ['phq9', 'gad7', 'asq', 'isi', 'audit'],
  },
  {
    id: 'adhd',
    label: 'Скрининг СДВГ',
    short: 'СДВГ',
    desc: 'ASRS (самоотчёт) + DIVA-5 (клиницист). Для запроса «а вдруг у меня СДВГ».',
    testIds: ['asrs', 'diva5'],
  },
  {
    id: 'asd',
    label: 'Скрининг аутизма',
    short: 'Аутизм',
    desc: 'AQ-10 → RAADS-R → CAT-Q. При необходимости добавьте AQ-50 вручную.',
    testIds: ['aq10', 'raadsr', 'catq'],
  },
]

export function batteryTests(battery: ScreeningBattery, all: TestConfig[]): TestConfig[] {
  return battery.testIds.map((id) => all.find((t) => t.id === id)).filter(Boolean) as TestConfig[]
}

export function getBattery(id: string | null | undefined): ScreeningBattery | undefined {
  if (!id) return undefined
  return screeningBatteries.find((b) => b.id === id)
}
