/** Свободные бланки: можно воспроизводить официальную форму (только русский) */

export interface FreeBlankInfo {
  id: string
  /** Краткая метка в UI */
  badge: string
  /** Строка авторства на бланке */
  attribution: string
  /** Откуда форма */
  source: string
  /** PDF-эталон на русском в public/original-blanks/ */
  pdfFiles?: { file: string; label: string }[]
}

export const freeBlanks: FreeBlankInfo[] = [
  {
    id: 'phq9',
    badge: 'свободный оригинал',
    attribution:
      'PHQ-9: Spitzer, Williams, Kroenke и соавт.; образовательный грант Pfizer Inc. Воспроизведение, перевод и распространение разрешены без отдельного разрешения (phqscreeners.com).',
    source: 'phqscreeners.com',
    pdfFiles: [{ file: 'phq9.pdf', label: 'Скачать PDF' }],
  },
  {
    id: 'gad7',
    badge: 'свободный оригинал',
    attribution:
      'GAD-7: Spitzer, Williams, Kroenke и соавт.; образовательный грант Pfizer Inc. Воспроизведение, перевод и распространение разрешены без отдельного разрешения (phqscreeners.com).',
    source: 'phqscreeners.com',
  },
  {
    id: 'audit',
    badge: 'свободный оригинал',
    attribution:
      'AUDIT © Всемирная организация здравоохранения. Допускается полное воспроизведение для некоммерческого клинического применения; не для продажи.',
    source: 'ВОЗ / auditscreen.org',
    pdfFiles: [{ file: 'audit.pdf', label: 'Скачать PDF' }],
  },
  {
    id: 'pcl5',
    badge: 'свободный оригинал',
    attribution:
      'PCL-5: Weathers и соавт.; National Center for PTSD (общественное достояние). Русская печатная форма — по тексту шкалы в МЕТР.',
    source: 'National Center for PTSD',
  },
  {
    id: 'asq',
    badge: 'официальная форма',
    attribution:
      'ASQ — методика скрининга по приказу Минздрава РБ от 11.11.2025 №1351. Печать — из загруженного docx.',
    source: 'Минздрав РБ · ASQ',
    pdfFiles: [{ file: 'asq-screening.docx', label: 'Исходный docx' }],
  },
  {
    id: 'asrs',
    badge: 'свободный оригинал',
    attribution:
      'ASRS v1.1 © ВОЗ / Kessler и соавт. Свободное использование; не изменять варианты ответа и алгоритм. Цитировать: Kessler et al., Psychological Medicine, 2005.',
    source: 'ВОЗ / ASRS',
  },
  {
    id: 'ace',
    badge: 'свободный оригинал',
    attribution:
      'Опросник неблагоприятного детского опыта (ACE) — скрининговая форма общественного здравоохранения (линия CDC/ВОЗ). Для клинического скрининга.',
    source: 'CDC / ВОЗ · ACE',
  },
  {
    id: 'stopbang',
    badge: 'свободный оригинал',
    attribution:
      'STOP-BANG — клинический скрининг обструктивного апноэ сна. При цитировании указывайте Chung и соавт.',
    source: 'STOP-BANG',
  },
  {
    id: 'whodas',
    badge: 'свободный оригинал',
    attribution:
      'WHODAS 2.0 © Всемирная организация здравоохранения. Бесплатно для клинического применения по условиям ВОЗ; электронные внедрения могут требовать отдельного разрешения.',
    source: 'ВОЗ · WHODAS 2.0',
  },
  {
    id: 'aq10',
    badge: 'свободный оригинал',
    attribution:
      'AQ-10 © SBC/CA/BA/ARC / Кембриджский университет. Краткая форма коэффициента аутистического спектра (Allison, Auyeung и Baron-Cohen, 2012).',
    source: 'Cambridge Autism Research Centre',
  },
]

const byId = Object.fromEntries(freeBlanks.map((b) => [b.id, b]))

export function getFreeBlank(id: string): FreeBlankInfo | undefined {
  return byId[id]
}

export function isFreeOfficialBlank(id: string): boolean {
  return id in byId
}

/** Путь к PDF относительно страницы (vite base: ./) */
export function originalBlankHref(file: string): string {
  return new URL(`./original-blanks/${file}`, window.location.href).href
}
