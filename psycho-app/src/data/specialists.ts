/** Специалист, чьи данные печатаются внизу бланка */
export interface Specialist {
  id: string
  /** ФИО целиком — в интерфейсе и на бланке */
  fullName: string
  /** Краткая форма (инициалы) */
  shortName: string
  /** Должность на бланке */
  title: string
}

export const specialists: Specialist[] = [
  {
    id: 'kavetsky',
    fullName: 'Кавецкий Антон Сергеевич',
    shortName: 'Кавецкий А.С.',
    title: 'Врач-психотерапевт',
  },
  {
    id: 'bubnova',
    fullName: 'Бубнова Вероника Геннадьевна',
    shortName: 'Бубнова В.Г.',
    title: 'Врач-психотерапевт',
  },
]

export const defaultSpecialistId = specialists[0]!.id

export function getSpecialist(id: string | null | undefined): Specialist {
  return specialists.find((s) => s.id === id) ?? specialists[0]!
}
