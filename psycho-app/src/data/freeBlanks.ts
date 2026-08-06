/** Свободные бланки: можно воспроизводить официальную форму */

export interface FreeBlankInfo {
  id: string
  /** Краткая метка в UI */
  badge: string
  /** Строка авторства на бланке (как требует источник) */
  attribution: string
  /** Откуда форма */
  source: string
  /** Файлы PDF в public/original-blanks/ (эталон) */
  pdfFiles?: { file: string; lang: 'ru' | 'en'; label: string }[]
}

export const freeBlanks: FreeBlankInfo[] = [
  {
    id: 'phq9',
    badge: 'свободный оригинал',
    attribution:
      'Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues, with an educational grant from Pfizer Inc. No permission required to reproduce, translate, display or distribute.',
    source: 'phqscreeners.com',
    pdfFiles: [
      { file: 'phq9.ru.pdf', lang: 'ru', label: 'PDF · RU' },
      { file: 'phq9.en.pdf', lang: 'en', label: 'PDF · EN' },
    ],
  },
  {
    id: 'gad7',
    badge: 'свободный оригинал',
    attribution:
      'Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues, with an educational grant from Pfizer Inc. No permission required to reproduce, translate, display or distribute.',
    source: 'phqscreeners.com',
    pdfFiles: [{ file: 'gad7.en.pdf', lang: 'en', label: 'PDF · EN' }],
  },
  {
    id: 'audit',
    badge: 'свободный оригинал',
    attribution:
      'AUDIT © World Health Organization. May be reproduced in full for non-commercial clinical use; not for sale.',
    source: 'WHO / auditscreen.org',
    pdfFiles: [{ file: 'audit.ru.pdf', lang: 'ru', label: 'PDF · RU' }],
  },
  {
    id: 'pcl5',
    badge: 'свободный оригинал',
    attribution:
      'PCL-5 © Weathers et al.; available from the National Center for PTSD (public domain). www.ptsd.va.gov',
    source: 'VA National Center for PTSD',
    pdfFiles: [{ file: 'pcl5.en.pdf', lang: 'en', label: 'PDF · EN' }],
  },
  {
    id: 'asq',
    badge: 'свободный оригинал',
    attribution:
      'Ask Suicide-Screening Questions (ASQ) © National Institute of Mental Health (NIMH). Free for clinical use.',
    source: 'NIMH ASQ Toolkit',
  },
  {
    id: 'asrs',
    badge: 'свободный оригинал',
    attribution:
      'Adult ADHD Self-Report Scale (ASRS v1.1) © WHO / Kessler et al. Free to use; do not alter response options or scoring. Cite Kessler et al., Psychological Medicine, 2005.',
    source: 'Harvard NCS / WHO ASRS',
  },
  {
    id: 'ace',
    badge: 'свободный оригинал',
    attribution:
      'Adverse Childhood Experiences (ACE) questionnaire — public health screening form (CDC/WHO lineage). For clinical screening use.',
    source: 'CDC / WHO ACE forms',
  },
  {
    id: 'stopbang',
    badge: 'свободный оригинал',
    attribution:
      'STOP-BANG questionnaire — clinical screening for obstructive sleep apnea. Use with citation to Chung et al.',
    source: 'STOP-BANG',
  },
  {
    id: 'whodas',
    badge: 'свободный оригинал',
    attribution:
      'WHODAS 2.0 © World Health Organization. Free for clinical use under WHO terms; electronic implementations may need separate permission.',
    source: 'WHO WHODAS 2.0',
  },
  {
    id: 'aq10',
    badge: 'свободный оригинал',
    attribution:
      'AQ-10 © SBC/CA/BA/ARC/Cambridge University. Autism Spectrum Quotient short form (Allison, Auyeung & Baron-Cohen, 2012).',
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
