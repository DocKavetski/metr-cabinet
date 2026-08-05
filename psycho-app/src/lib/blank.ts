import type { Option, TestConfig } from '../types'
import { escapeHtml, optionLabel, optionValue, todayRu } from './utils'

function doctorFooter(): string {
  return `<div class="blank-footer">
  <span>${escapeHtml(todayRu())}</span>
  <span>Врач-психотерапевт ________ Кавецкий А.С.</span>
</div>`
}

function useMatrixLayout(test: TestConfig, questionCount: number, optionCount: number): boolean {
  if (test.blankLayout === 'matrix') return true
  if (test.blankLayout === 'list') return false
  if (test.kind === 'scl90') return true
  return questionCount >= 20 && optionCount >= 2 && optionCount <= 10
}

/**
 * Короткий бланк (примерно ≤ половины листа A4) — в пакете можно ставить
 * несколько подряд на одном листе. Всё, что длиннее — отдельным блоком.
 */
function isCompactBlank(test: TestConfig): boolean {
  if (test.id === 'bdi') return false
  if (test.kind === 'text' || test.clinicianDomains?.length) {
    // протокол MoCA/MMSE короткий
    return (test.clinicianDomains?.length ?? 0) <= 8
  }
  if (test.kind === 'asq') return true
  if (test.items?.length) return test.items.length <= 8
  const q = test.questions?.length ?? 0
  if (!q) return true
  const optCount = test.options?.length ?? 4
  if (useMatrixLayout(test, q, optCount)) return q <= 16
  return q <= 12
}

/**
 * Оценка числа страниц бланка / блока (для двусторонней печати пакета).
 */
function estimatePrintPages(test: TestConfig): number {
  if (test.id === 'bdi') return 2
  if (test.kind === 'text' || test.clinicianDomains?.length) return 1
  if (test.kind === 'asq') return 1
  if (test.items?.length) {
    return Math.max(1, Math.ceil(test.items.length / 11))
  }
  const q = test.questions?.length ?? 0
  if (!q) return 1
  const optCount = test.options?.length ?? 4
  if (useMatrixLayout(test, q, optCount)) {
    const perPage = test.id === 'scl90' ? 40 : optCount >= 7 ? 30 : 36
    return Math.max(1, Math.ceil(q / perPage))
  }
  return Math.max(1, Math.ceil(q / 20))
}

/** Компактные тесты в один блок; длинные — каждый сам по себе */
function groupPackBlocks(tests: TestConfig[]): { tests: TestConfig[]; compact: boolean }[] {
  const blocks: { tests: TestConfig[]; compact: boolean }[] = []
  for (const t of tests) {
    const compact = isCompactBlank(t)
    const last = blocks[blocks.length - 1]
    if (compact && last?.compact) last.tests.push(t)
    else blocks.push({ tests: [t], compact })
  }
  return blocks
}

function estimateBlockPages(block: { tests: TestConfig[]; compact: boolean }): number {
  if (!block.compact) return estimatePrintPages(block.tests[0]!)
  // каждый короткий ≈ ½ листа; 1→1 стр., 2→1, 3→2, 4→2…
  return Math.max(1, Math.ceil(block.tests.length * 0.5))
}

function duplexPadHtml(): string {
  return `<div class="blank-duplex-spacer" aria-hidden="true"><span class="blank-duplex-mark"></span></div>`
}

function asHalfSheet(html: string): string {
  return html.replace(
    /class="blank-sheet([^"]*)"/,
    'class="blank-sheet$1 blank-sheet-half"',
  )
}

function cutLineHtml(): string {
  return `<div class="blank-cut-line" aria-hidden="true"><span>разрез</span></div>`
}

/** Одна страница A4: верхняя половина + пунктир + нижняя (или пусто) */
function halfPageHtml(topHtml: string, bottomHtml?: string): string {
  const bottom = bottomHtml
    ? `<div class="blank-half-slot blank-half-bottom">${asHalfSheet(bottomHtml)}</div>`
    : `<div class="blank-half-slot blank-half-bottom blank-half-empty"></div>`
  return `<div class="blank-half-page">
    <div class="blank-half-slot blank-half-top">${asHalfSheet(topHtml)}</div>
    ${cutLineHtml()}
    ${bottom}
  </div>`
}

/** Короткие тесты — парами на лист с линией разреза посередине */
function renderCompactBlock(tests: TestConfig[]): string {
  const pages: string[] = []
  for (let i = 0; i < tests.length; i += 2) {
    const a = tests[i]!
    const b = tests[i + 1]
    pages.push(halfPageHtml(buildBlankHtml(a), b ? buildBlankHtml(b) : undefined))
    if (i + 2 < tests.length) {
      pages.push(`<div class="blank-page-break"></div>`)
    }
  }
  return pages.join('')
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

function matrixThead(opts: Option[]): string {
  const cols = opts
    .map((o) => {
      const v = optionValue(o)
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

function buildMatrixBlank(test: TestConfig, questions: string[], opts: Option[]): string {
  return `<div class="blank-sheet blank-sheet-matrix">
    ${header(test, 'matrix')}
    <table class="blank-matrix">
      ${matrixThead(opts)}
      <tbody>${matrixRows(questions, opts, 0)}</tbody>
    </table>
    ${doctorFooter()}
  </div>`
}

function clinicianProtocol(test: TestConfig): string {
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
    ${doctorFooter()}
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

export function buildBlankHtml(test: TestConfig): string {
  if (test.printable === false) {
    return `<div class="blank-sheet">${header(test, 'list')}<p>Бланк не предусмотрен.</p>${doctorFooter()}</div>`
  }

  if (test.kind === 'text' || test.clinicianDomains?.length) {
    return clinicianProtocol(test)
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
        ${doctorFooter()}
      </div>`
    }

    const rows = test.items.map((item, idx) => renderItem(item, idx)).join('')
    return `<div class="blank-sheet blank-sheet-bdi">
      ${header(test, 'items')}
      ${rows}
      ${doctorFooter()}
    </div>`
  }

  if (test.kind === 'asq') {
    const qs = (test.questions || []).slice(0, 4)
    const yn = circles([0, 1])
    const rows = qs
      .map(
        (q, i) =>
          `<div class="blank-item">
            <div class="blank-qnum">${i + 1}.</div>
            <div class="blank-qtext">${escapeHtml(q)}</div>
            <div class="blank-opts">${yn}</div>
          </div>`,
      )
      .join('')
    const acuity = `<div class="blank-item blank-acute">
      <div class="blank-qnum">5.</div>
      <div class="blank-qtext">Острота: мысли покончить с собой прямо сейчас?</div>
      <div class="blank-opts">${yn}</div>
    </div>`
    // легенда 0/1 только если нет своей инструкции
    const legend = test.blankInstruction
      ? ''
      : `<p class="blank-legend">0 — Нет · 1 — Да</p>`
    return `<div class="blank-sheet">
      ${header(test, 'list')}
      ${legend}
      ${rows}${acuity}
      ${doctorFooter()}
    </div>`
  }

  const questions = test.questions || []
  const opts = test.options || [0, 1, 2, 3]

  if (useMatrixLayout(test, questions.length, opts.length)) {
    return buildMatrixBlank(test, questions, opts)
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
    ${doctorFooter()}
  </div>`
}

export function printBlanks(tests: TestConfig[]): void {
  if (!tests.length) return

  const blocks = groupPackBlocks(tests)
  const html = blocks
    .map((block, i) => {
      const unit = block.compact
        ? `<div class="blank-pack-block blank-pack-block-compact">${renderCompactBlock(block.tests)}</div>`
        : `<div class="blank-pack-block"><div class="blank-pack-unit">${buildBlankHtml(block.tests[0]!)}</div></div>`

      if (i >= blocks.length - 1) return unit

      const pages = estimateBlockPages(block)
      const pad = pages % 2 === 1 ? duplexPadHtml() : ''
      return `${unit}<div class="blank-page-break blank-pack-break"></div>${pad}`
    })
    .join('')

  const area = document.getElementById('print-root')
  if (!area) return
  area.innerHTML = html
  document.body.classList.add('printing')
  window.print()
  const cleanup = () => {
    document.body.classList.remove('printing')
    area.innerHTML = ''
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  setTimeout(cleanup, 1500)
}

export function printBlank(test: TestConfig): void {
  printBlanks([test])
}
