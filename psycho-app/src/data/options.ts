import type { Option } from '../types'

/** Стандартное «Нет / Да» (0 / 1) */
export const yesNo: Option[] = [
  { value: 0, label: 'Нет' },
  { value: 1, label: 'Да' },
]

/** Краткая формулировка 5‑го пункта ASQ на печатном бланке */
export const ASQ_ACUITY_BLANK =
  'Острота: мысли покончить с собой прямо сейчас?'
