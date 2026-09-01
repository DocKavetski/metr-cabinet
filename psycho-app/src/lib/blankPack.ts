import { isFreeOfficialBlank } from '../data/freeBlanks'
import type { Specialist } from '../data/specialists'
import { getSpecialist } from '../data/specialists'
import type { TestConfig } from '../types'
import { buildConsentDocHtml } from './consentDoc'
import { buildBlankHtml, prefersMatrixLayout } from './blankHtml'

function runPrint(html: string): void {
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

/**
 * Короткий бланк (примерно ≤ половины листа A4) — в пакете можно ставить
 * несколько подряд на одном листе. Всё, что длиннее — отдельным блоком.
 */
function isCompactBlank(test: TestConfig): boolean {
  if (test.id === 'bdi') return false
  if (test.kind === 'asq' || test.id === 'asq') return false
  if (isFreeOfficialBlank(test.id)) {
    if (test.id === 'pcl5' || test.id === 'asrs' || test.id === 'whodas') return false
    const q = test.questions?.length ?? 0
    return q > 0 && q <= 12
  }
  if (test.kind === 'text' || test.clinicianDomains?.length) {
    return (test.clinicianDomains?.length ?? 0) <= 8
  }
  if (test.items?.length) return test.items.length <= 8
  const q = test.questions?.length ?? 0
  if (!q) return true
  const optCount = test.options?.length ?? 4
  if (prefersMatrixLayout(test, q, optCount)) return q <= 16
  return q <= 12
}

function estimatePrintPages(test: TestConfig): number {
  if (test.id === 'bdi') return 2
  if (test.kind === 'text' || test.clinicianDomains?.length) return 1
  if (test.kind === 'asq') return 2
  if (test.items?.length) {
    return Math.max(1, Math.ceil(test.items.length / 11))
  }
  const q = test.questions?.length ?? 0
  if (!q) return 1
  const optCount = test.options?.length ?? 4
  if (prefersMatrixLayout(test, q, optCount)) {
    const perPage = test.id === 'scl90' ? 40 : test.id === 'des' || optCount >= 8 ? 28 : 36
    return Math.max(1, Math.ceil(q / perPage))
  }
  return Math.max(1, Math.ceil(q / 20))
}

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

function renderCompactBlock(tests: TestConfig[], specialist: Specialist): string {
  const pages: string[] = []
  for (let i = 0; i < tests.length; i += 2) {
    const a = tests[i]!
    const b = tests[i + 1]
    pages.push(halfPageHtml(buildBlankHtml(a, specialist), b ? buildBlankHtml(b, specialist) : undefined))
    if (i + 2 < tests.length) {
      pages.push(`<div class="blank-page-break"></div>`)
    }
  }
  return pages.join('')
}

export function printBlanks(tests: TestConfig[], specialist: Specialist = getSpecialist(undefined)): void {
  if (!tests.length) return

  const blocks = groupPackBlocks(tests)
  const html = blocks
    .map((block, i) => {
      const unit = block.compact
        ? `<div class="blank-pack-block blank-pack-block-compact">${renderCompactBlock(block.tests, specialist)}</div>`
        : `<div class="blank-pack-block"><div class="blank-pack-unit">${buildBlankHtml(block.tests[0]!, specialist)}</div></div>`

      if (i >= blocks.length - 1) return unit

      const pages = estimateBlockPages(block)
      const pad = pages % 2 === 1 ? duplexPadHtml() : ''
      return `${unit}<div class="blank-page-break blank-pack-break"></div>${pad}`
    })
    .join('')

  const area = document.getElementById('print-root')
  if (!area) return
  runPrint(html)
}

export function printConsent(specialist: Specialist = getSpecialist(undefined)): void {
  runPrint(buildConsentDocHtml(specialist))
}

export function printBlank(test: TestConfig, specialist: Specialist = getSpecialist(undefined)): void {
  printBlanks([test], specialist)
}
