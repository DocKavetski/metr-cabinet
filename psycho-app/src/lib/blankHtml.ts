import { getFreeBlank } from '../data/freeBlanks'
import type { Specialist } from '../data/specialists'
import { getSpecialist } from '../data/specialists'
import type { Option, TestConfig } from '../types'
import { getAsqScreeningHtml } from './officialDocs'
import {
  buildFreeOfficialTableBlank,
  phqDifficultyExtra,
} from './officialBlank'
import { escapeHtml, optionLabel, optionValue, todayRu } from './utils'

function doctorFooter(specialist: Specialist): string {
  return `<div class="blank-footer">
  <span>${escapeHtml(todayRu())}</span>
  <span>${escapeHtml(specialist.title)} ________ ${escapeHtml(specialist.fullName)}</span>
</div>`
}

export function prefersMatrixLayout(test: TestConfig, questionCount: number, optionCount: number): boolean {
  if (test.blankLayout === 'matrix') return true
  if (test.blankLayout === 'list') return false
  if (test.kind === 'scl90') return true
  return questionCount >= 20 && optionCount >= 2 && optionCount <= 10
}
function defaultInstruction(test: TestConfig, layout: 'matrix' | 'list' | 'items' | 'clinician'): string {
  if (test.blankInstruction) return test.blankInstruction
  if (layout === 'clinician') return 'Заполняет специалист.'
  if (layout === 'matrix') return 'В каждой строке поставьте крестик ✕ в одном столбце.'
  if (layout === 'items') return 'В каждом пункте отметьте одно утверждение.'
  return 'Один ответ на пункт: закрасьте кружок или ✕.'
}

function header(test: TestConfig, layout: 'matrix' | 'list' | 'items' | 'clinician'): string {
  const isClinician = test.blankAudience === 'clinician' || layout === 'clinician'
  const instruction = defaultInstruction(test, isClinician && layout === 'clinician' ? 'clinician' : layout)
  const mark = isClinician && layout === 'clinician' ? `<span class="blank-mark">для специалиста</span> ` : ''

  return `<div class="blank-header">
    <h1>${mark}${escapeHtml(test.label)}</h1>
    <p class="blank-instruction">${escapeHtml(instruction)}</p>
  </div>`
}

function circles(values: number[]): string {
  return values.map((v) => `<span class="blank-circle"><i></i>${v}</span>`).join('')
}

function shortOptLabel(o: Option): string {
  return optionLabel(o).replace(/^\d+\s*[—–-]\s*/, '').trim()
}

/** Широкая матрица (много столбцов) — компактная печать, без длинных подписей в шапке */
function prefersDenseMatrix(test: TestConfig, optionCount: number): boolean {
  if (test.id === 'des') return true
  return optionCount >= 8
}

function matrixThead(opts: Option[], dense: boolean): string {
  const cols = opts
    .map((o) => {
      const v = optionValue(o)
      if (dense) {
        return `<th class="mx-opt"><span class="mx-val">${v}</span></th>`
      }
      const lab = shortOptLabel(o)
      return `<th class="mx-opt"><span class="mx-val">${v}</span><span class="mx-lab">${escapeHtml(lab)}</span></th>`
    })
    .join('')
  return `<thead>
    <tr>
      <th class="mx-num">№</th>
      <th class="mx-q">Утверждение</th>
      ${cols}
    </tr>
  </thead>`
}

function matrixRows(questions: string[], opts: Option[], startIndex: number): string {
  const n = opts.length
  return questions
    .map((q, i) => {
      const cells = Array.from({ length: n }, () => `<td class="mx-cell"></td>`).join('')
      return `<tr>
        <td class="mx-num">${startIndex + i + 1}</td>
        <td class="mx-q">${escapeHtml(q)}</td>
        ${cells}
      </tr>`
    })
    .join('')
}

function buildMatrixBlank(test: TestConfig, questions: string[], opts: Option[], specialist: Specialist): string {
  const dense = prefersDenseMatrix(test, opts.length)
  const sheetClass = dense
    ? 'blank-sheet blank-sheet-matrix blank-sheet-matrix-dense'
    : 'blank-sheet blank-sheet-matrix'
  const scoreKey = test.id === 'pdq20' ? pdq20BlankScoreKey() : ''
  const denseLegend =
    dense && test.id === 'des'
      ? `<p class="blank-legend">Шкала: 0 = никогда (0%) · 1 = 10% · … · 9 ≈ всегда (90–100%). Среднее ×10 ≈ балл 0–100.</p>`
      : dense
        ? `<p class="blank-legend">В каждой строке один крестик ✕ в столбце с нужным баллом.</p>`
        : ''
  return `<div class="${sheetClass}">
    ${header(test, 'matrix')}
    ${denseLegend}
    <table class="blank-matrix">
      ${matrixThead(opts, dense)}
      <tbody>${matrixRows(questions, opts, 0)}</tbody>
    </table>
    ${scoreKey}
    ${doctorFooter(specialist)}
  </div>`
}

/** Ключ подсчёта PDQ-20 как в оригинальном бланке */
function pdq20BlankScoreKey(): string {
  return `<div class="blank-scorebox blank-pdq-key">
    <p><strong>Подсчёт баллов</strong> (каждый пункт 0–4)</p>
    <table class="blank-domain-table">
      <tbody>
        <tr><td>Концентрация внимания</td><td class="blank-domain-score">1+5+9+13+17 = ____ / 20</td></tr>
        <tr><td>Ретроспективная память</td><td class="blank-domain-score">2+6+10+14+18 = ____ / 20</td></tr>
        <tr><td>Проспективная память</td><td class="blank-domain-score">3+7+11+15+19 = ____ / 20</td></tr>
        <tr><td>Планирование и организация</td><td class="blank-domain-score">4+8+12+16+20 = ____ / 20</td></tr>
        <tr><td>Общая оценка воспринимаемого дефицита</td><td class="blank-domain-score">сумма всех пунктов = ____ / 80</td></tr>
      </tbody>
    </table>
    <p class="blank-legend">Пояснение: чем выше сумма баллов, тем более выражены когнитивные нарушения.</p>
  </div>`
}

function clinicianProtocol(test: TestConfig, specialist: Specialist): string {
  const domains = test.clinicianDomains || []
  const rows = domains
    .map((d) => {
      const hint = d.hint ? ` <span class="blank-domain-hint">(${escapeHtml(d.hint)})</span>` : ''
      return `<tr>
        <td>${escapeHtml(d.name)}${hint}</td>
        <td class="blank-domain-score">____ / ${d.max}</td>
      </tr>`
    })
    .join('')

  const maxSum = domains.reduce((s, d) => s + d.max, 0) || 30

  return `<div class="blank-sheet">
    ${header(test, 'clinician')}
    <table class="blank-domain-table">
      <tbody>${rows}</tbody>
    </table>
    <p class="blank-scoreline">Сумма ____ / ${maxSum}${
      test.id === 'moca' ? ' · при ≤12 лет обр. +1 → итог ____ / 30' : ' · итог ____ / 30'
    }</p>
    ${doctorFooter(specialist)}
  </div>`
}

/** Легенда шкалы только если она не дублирует blankInstruction */
function scaleLegend(test: TestConfig, opts: Option[]): string {
  const values = opts.map(optionValue)
  const instr = (test.blankInstruction || '').toLowerCase()

  // короткая шкала цифр — не дублируем, если инструкция уже всё объясняет и вариантов мало с длинными подписями в шапке matrix
  const parts = opts.map((o) => {
    const lab = optionLabel(o)
    if (lab.length > 32) return String(optionValue(o))
    return `${optionValue(o)} — ${lab.replace(/^\d+\s*[—–-]\s*/, '')}`
  })

  const compact = `${values[0]}–${values[values.length - 1]}`
  if (instr.includes(compact) || instr.includes('крестик') || instr.includes('кружок')) {
    // инструкция уже про то, как отвечать — легенду не дублируем длинным текстом
    if (parts.every((p) => p.length <= 3) || opts.every((o) => typeof o === 'number')) {
      return ''
    }
  }

  if (parts.length <= 6 && parts.join('').length < 120) {
    return `<p class="blank-legend">${escapeHtml(parts.join(' · '))}</p>`
  }
  return `<p class="blank-legend">Шкала ${values[0]}–${values[values.length - 1]}.</p>`
}

export function buildBlankHtml(test: TestConfig, specialist: Specialist = getSpecialist(undefined)): string {
  if (test.kind === 'asq' || test.id === 'asq') {
    return getAsqScreeningHtml(specialist)
  }

  const free = getFreeBlank(test.id)
  if (free) {
    const foot = doctorFooter(specialist)
    const extras = test.id === 'phq9' ? phqDifficultyExtra() : ''
    return buildFreeOfficialTableBlank(test, foot, free, extras)
  }

  if (test.printable === false) {
    return `<div class="blank-sheet">${header(test, 'list')}<p>Бланк не предусмотрен.</p>${doctorFooter(specialist)}</div>`
  }

  if (test.kind === 'text' || test.clinicianDomains?.length) {
    return clinicianProtocol(test, specialist)
  }

  if (test.items?.length) {
    const renderItem = (item: NonNullable<TestConfig['items']>[number], idx: number) => {
      const title = item.title
        ? `<div class="blank-item-title">${escapeHtml(item.title)}</div>`
        : ''
      const opts = item.options
        .map(
          (text, v) =>
            `<div class="blank-bdi-opt"><span class="blank-circle"><i></i>${v}</span>${escapeHtml(text)}</div>`,
        )
        .join('')
      return `<div class="blank-item blank-bdi-row">
        <div class="blank-qnum">${idx + 1}.</div>
        <div class="blank-bdi">${title}${opts}</div>
      </div>`
    }

    // BDI: 2 стороны A4 — без повторной легенды (инструкция уже в шапке)
    if (test.id === 'bdi' && test.items.length === 21) {
      const page1 = test.items.slice(0, 11).map((item, i) => renderItem(item, i)).join('')
      const page2 = test.items.slice(11).map((item, i) => renderItem(item, i + 11)).join('')
      return `<div class="blank-sheet blank-sheet-bdi">
        ${header(test, 'items')}
        ${page1}
        <p class="blank-turn">→ оборот</p>
        <div class="blank-page-break"></div>
        <p class="blank-continued">${escapeHtml(test.label)} · продолжение (12–21)</p>
        ${page2}
        ${doctorFooter(specialist)}
      </div>`
    }

    const rows = test.items.map((item, idx) => renderItem(item, idx)).join('')
    return `<div class="blank-sheet blank-sheet-bdi">
      ${header(test, 'items')}
      ${rows}
      ${doctorFooter(specialist)}
    </div>`
  }

  const questions = test.questions || []
  const opts = test.options || [0, 1, 2, 3]

  if (prefersMatrixLayout(test, questions.length, opts.length)) {
    return buildMatrixBlank(test, questions, opts, specialist)
  }

  const values = opts.map(optionValue)
  const rows = questions
    .map(
      (q, i) => `<div class="blank-item">
        <div class="blank-qnum">${i + 1}.</div>
        <div class="blank-qtext">${escapeHtml(q)}</div>
        <div class="blank-opts">${circles(values)}</div>
      </div>`,
    )
    .join('')

  return `<div class="blank-sheet">
    ${header(test, 'list')}
    ${scaleLegend(test, opts)}
    ${rows}
    ${doctorFooter(specialist)}
  </div>`
}

