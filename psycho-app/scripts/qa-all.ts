/**
 * Полный прогон: структура, бланки (дубли текста), расчёт min/max/ключевые кейсы.
 * Запуск: npx tsx scripts/qa-all.ts
 */
import { allTests } from '../src/data'
import { screeningBatteries } from '../src/data/batteries'
import { buildBlankHtml } from '../src/lib/blank'
import { getSpecialist, specialists } from '../src/data/specialists'
import { calculateFromString, scoreAq10, scoreAq50, scoreFsfi } from '../src/lib/scoring'
import { defaultTemplateForBattery, formatSummary } from '../src/lib/summaryTemplates'
import { expectedLength, getDigitRange, optionValue } from '../src/lib/utils'
import type { TestConfig } from '../src/types'

const errors: string[] = []
const warnings: string[] = []

function fail(msg: string) {
  errors.push(msg)
}
function warn(msg: string) {
  warnings.push(msg)
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function fillString(test: TestConfig, value: number): string {
  const len = expectedLength(test)
  const { min, max } = getDigitRange(test)
  const v = Math.min(max, Math.max(min, value))
  return String(v).repeat(len)
}

console.log(`Шкал в реестре: ${allTests.length}`)

// —— 1. Уникальность id ——
const ids = new Set<string>()
for (const t of allTests) {
  if (ids.has(t.id)) fail(`Дубль id: ${t.id}`)
  ids.add(t.id)
}

// —— 2. Структура + длина ——
for (const t of allTests) {
  const len = expectedLength(t)
  if (t.kind === 'text') {
    if (!t.scoreText) fail(`${t.id}: text без scoreText`)
    continue
  }
  if (len <= 0) fail(`${t.id}: expectedLength=${len}`)
  if (t.questions && t.items) warn(`${t.id}: и questions, и items`)
  if (t.questions && t.questions.length !== len && t.kind !== 'asq') {
    // asq: 5 в questions но expected 5 — ok
    if (!(t.kind === 'asq' && (t.questions?.length ?? 0) >= 4)) {
      if (t.questions.length !== len) fail(`${t.id}: questions=${t.questions.length} ≠ len=${len}`)
    }
  }
  if (t.items && t.items.length !== len) fail(`${t.id}: items=${t.items.length} ≠ len=${len}`)
  for (const q of t.questions || []) {
    if (!q.trim() || /^вопрос\s*\d+/i.test(q) || /^item\s*\d+/i.test(q)) {
      fail(`${t.id}: подозрительный/пустой вопрос: «${q.slice(0, 40)}»`)
    }
  }
  if (t.items) {
    for (let i = 0; i < t.items.length; i++) {
      if (!t.items[i].options?.length) fail(`${t.id} item ${i + 1}: нет options`)
    }
  }
}

// —— 3. Бланки: печать + дубли инструкций ——
const defaultDoctor = getSpecialist(undefined)
const otherDoctor = specialists.find((s) => s.id !== defaultDoctor.id)!
for (const t of allTests) {
  let html = ''
  try {
    html = buildBlankHtml(t, defaultDoctor)
  } catch (e) {
    fail(`${t.id}: buildBlankHtml упал: ${e}`)
    continue
  }
  if (!html.includes('blank-footer')) fail(`${t.id}: нет футера`)
  if (!html.includes(defaultDoctor.fullName)) fail(`${t.id}: нет ФИО специалиста`)
  if (!html.includes(defaultDoctor.title)) fail(`${t.id}: нет должности специалиста`)

  const alt = buildBlankHtml(t, otherDoctor)
  if (!alt.includes(otherDoctor.fullName)) fail(`${t.id}: смена специалиста не попала в бланк`)
  if (alt.includes(defaultDoctor.fullName)) fail(`${t.id}: старый специалист остался на бланке`)

  const text = stripHtml(html)
  const instr = (t.blankInstruction || '').trim()
  if (instr) {
    // фраза из инструкции не должна встречаться 2+ раза целиком
    const needle = instr.slice(0, Math.min(40, instr.length))
    if (needle.length >= 20) {
      const count = text.split(needle).length - 1
      if (count >= 2) fail(`${t.id}: повтор инструкции «${needle}…» ×${count}`)
    }
  }
  // типичные дубли
  const phrases = [
    'поставьте крестик',
    'В каждом пункте отметьте',
    'один кружок на пункт',
  ]
  for (const p of phrases) {
    const c = text.split(p).length - 1
    if (c >= 2) fail(`${t.id}: повтор «${p}» ×${c}`)
  }
  // противоречие: матрица + «кружок» в инструкции
  if (html.includes('blank-matrix') && /закрасьте кружок|один кружок/i.test(text)) {
    warn(`${t.id}: матрица, но в тексте про кружки`)
  }
}

// —— 4. Расчёт: min / max / неполный ——
for (const t of allTests) {
  if (t.kind === 'text') {
    const bad = calculateFromString(t, '')
    if (bad.ok) fail(`${t.id}: пустой text не должен быть ok`)
    const ok26 = calculateFromString(t, '26')
    if (!ok26.ok) fail(`${t.id}: '26' должен считаться: ${ok26.text}`)
    if (t.id === 'moca') {
      const domains = calculateFromString(t, '5 3 6 3 2 5 6')
      if (!domains.ok) fail(`moca domains: ${domains.text}`)
      else if (!domains.text.includes('30')) fail(`moca domains sum: ${domains.text}`)
    }
    continue
  }

  const len = expectedLength(t)
  const { min, max } = getDigitRange(t)

  const incomplete = calculateFromString(t, fillString(t, min).slice(0, Math.max(0, len - 1)))
  if (incomplete.ok) fail(`${t.id}: неполный ввод не должен быть ok`)

  const atMin = calculateFromString(t, fillString(t, min))
  if (!atMin.ok) fail(`${t.id} min: ${atMin.text}`)

  const atMax = calculateFromString(t, fillString(t, max))
  if (!atMax.ok) fail(`${t.id} max: ${atMax.text}`)

  // сумма для простых шкал
  if (!t.score && !['scl90', 'asq', 'fsfi', 'aq10', 'aq50'].includes(t.id) && t.kind !== 'scl90' && t.kind !== 'asq') {
    const sumMin = len * min
    const sumMax = len * max
    if (atMin.ok && atMin.score !== undefined && atMin.score !== sumMin) {
      // interpret returns score
      if (Math.abs((atMin.score ?? -1) - sumMin) > 0.01) {
        // custom may differ
      }
    }
    if (atMin.ok && atMin.text && !atMin.text.includes(String(sumMin)) && t.interpretation) {
      // PHQ etc should show total
      if (!atMin.text.startsWith(String(sumMin)) && !atMin.text.includes(`${sumMin} `) && !atMin.text.includes(`${sumMin}балл`)) {
        // Russian "0 баллов"
        if (!atMin.text.includes(`${sumMin}`)) {
          warn(`${t.id} min: ожидалась сумма ${sumMin} в «${atMin.text}»`)
        }
      }
    }
    if (atMax.ok && !atMax.text.includes(String(sumMax))) {
      warn(`${t.id} max: ожидалась сумма ${sumMax} в «${atMax.text.slice(0, 80)}»`)
    }
  }
}

// —— 5. Ключевые контрольные кейсы ——
function mustOk(id: string, raw: string, includes: string | RegExp) {
  const t = allTests.find((x) => x.id === id)
  if (!t) {
    fail(`нет теста ${id}`)
    return
  }
  const r = calculateFromString(t, raw)
  if (!r.ok) {
    fail(`${id} [${raw.slice(0, 20)}…]: ${r.text}`)
    return
  }
  const ok = typeof includes === 'string' ? r.text.includes(includes) : includes.test(r.text)
  if (!ok) fail(`${id}: ожидали ${includes}, получили «${r.text}»`)
}

// PHQ-9 all 0 → 0
mustOk('phq9', '0'.repeat(9), '0')
mustOk('phq9', '3'.repeat(9), '27')
mustOk('gad7', '0'.repeat(7), '0')
mustOk('gad7', '3'.repeat(7), '21')

// BDI
mustOk('bdi', '0'.repeat(21), /0/)
mustOk('bdi', '3'.repeat(21), /63/)

// HADS 14 items
{
  const t = allTests.find((x) => x.id === 'hads')!
  const r = calculateFromString(t, '0'.repeat(14))
  if (!r.ok) fail(`hads: ${r.text}`)
}

// SCL all 1 → all 0 on 0-4 scale → GSI 0
mustOk('scl90', '1'.repeat(90), 'GSI 0.00')
mustOk('scl90', '5'.repeat(90), 'GSI 4.00')

// FSFI all 0
{
  const t = allTests.find((x) => x.id === 'fsfi')!
  const r = calculateFromString(t, '0'.repeat(19))
  if (!r.ok) fail(`fsfi: ${r.text}`)
  else if (!r.text.includes('0.00') && !r.text.includes('0.0')) warn(`fsfi zero: ${r.text}`)
}
// FSFI max roughly 36
{
  const a = Array(19).fill(5)
  // FSFI items often 0-5; desire uses 1-5 typically but we allow 0-5
  const text = scoreFsfi(a)
  if (!text.includes('36')) {
    // desire 5+5 *0.6=6; arousal 20*0.3=6; lub 20*0.3=6; org 15*0.4=6; sat 15*0.4=6; pain 15*0.4=6 → 36
    if (!text.includes('36.00')) fail(`fsfi max: ${text}`)
  }
}

// AQ-10: all no (0) on disagree-keyed = points; agree-keyed need 1
{
  const allNo = Array(10).fill(0)
  const s = scoreAq10(allNo)
  // agree idx 0,6,7,9 get 0; others get 1 for no → 6 points
  if (s !== 6) fail(`aq10 allNo expected 6 got ${s}`)
  const allYes = Array(10).fill(1)
  const s2 = scoreAq10(allYes)
  // agree get 1 (4 items); disagree get 0 → 4
  if (s2 !== 4) fail(`aq10 allYes expected 4 got ${s2}`)
}

// AQ-50: all disagree-pattern for max autistic? all 0: agree items 0, disagree items score → 26 disagree keyed
{
  const allNo = Array(50).fill(0)
  const s = scoreAq50(allNo)
  if (s !== 26) fail(`aq50 allNo expected 26 (disagree-keyed) got ${s}`)
  const allYes = Array(50).fill(1)
  const s2 = scoreAq50(allYes)
  if (s2 !== 24) fail(`aq50 allYes expected 24 (agree-keyed) got ${s2}`)
}

// ASQ — только число «Да», без клинических формулировок
mustOk('asq', '00000', '0/5')
mustOk('asq', '10000', '1/5')
mustOk('asq', '10001', '2/5')
mustOk('asq', '11111', '5/5')

// IIEF-5 min 5 max 25
mustOk('iief5', '11111', '5/25')
mustOk('iief5', '55555', '25/25')

// ACE
mustOk('ace', '0'.repeat(10), '0/10')
mustOk('ace', '1'.repeat(10), '10/10')

// ISI
mustOk('isi', '0'.repeat(7), '0')
mustOk('isi', '4'.repeat(7), '28')

// PSQI components from zeros
{
  const t = allTests.find((x) => x.id === 'psqi')!
  const r = calculateFromString(t, '0'.repeat(17))
  if (!r.ok) fail(`psqi: ${r.text}`)
  else if (!r.text.includes('0/21')) fail(`psqi zero: ${r.text}`)
}

// WHODAS
mustOk('whodas', '0'.repeat(12), '0/48')
mustOk('whodas', '4'.repeat(12), '48/48')

// LSAS 48 zeros
mustOk('lsas', '0'.repeat(48), '0/144')
mustOk('lsas', '3'.repeat(48), '144/144')

// PID-5
{
  const t = allTests.find((x) => x.id === 'pid5bf')!
  const r = calculateFromString(t, '0'.repeat(25))
  if (!r.ok) fail(`pid5bf: ${r.text}`)
}

// CTQ all 1
{
  const t = allTests.find((x) => x.id === 'ctq')!
  const r = calculateFromString(t, '1'.repeat(28))
  if (!r.ok) fail(`ctq: ${r.text}`)
}

// —— Клинические шаблоны сводки ——
{
  if (defaultTemplateForBattery('intake') !== 'intake') fail('defaultTemplate intake')
  if (defaultTemplateForBattery(null) !== 'all') fail('defaultTemplate null → all')

  const items = [
    { testId: 'phq9', label: 'PHQ-9', result: '10 баллов — умеренная' },
    { testId: 'gad7', label: 'GAD-7', result: '8 баллов' },
    { testId: 'asq', label: 'ASQ', result: 'ASQ: ответов «Да» — 1/5 (скрининг 1/4, острота 0/1).' },
  ]

  const intake = formatSummary(items, 'intake')
  for (const needle of [
    'Первичный скрининг',
    'PHQ-9:',
    'GAD-7:',
    'ASQ:',
    'ISI: — не заполнен',
    'AUDIT: — не заполнен',
    'Комментарий:',
  ]) {
    if (!intake.includes(needle)) fail(`intake template missing «${needle}»\n${intake}`)
  }

  const adhd = formatSummary(
    [{ testId: 'asrs', label: 'ASRS', result: 'ASRS: сумма 12/72' }],
    'adhd',
  )
  if (!adhd.includes('Скрининг СДВГ') || !adhd.includes('ASRS:') || !adhd.includes('DIVA-5: — не заполнен')) {
    fail(`adhd template:\n${adhd}`)
  }

  const asd = formatSummary([], 'asd')
  if (!asd.includes('AQ-10: — не заполнен') || !asd.includes('RAADS-R:') || !asd.includes('CAT-Q:')) {
    fail(`asd empty template:\n${asd}`)
  }

  for (const b of screeningBatteries) {
    if (!b.testIds.length) fail(`battery ${b.id} empty`)
    for (const id of b.testIds) {
      if (!allTests.some((t) => t.id === id)) fail(`battery ${b.id}: unknown test ${id}`)
    }
  }
}

// options digit range consistency for likert
for (const t of allTests) {
  if (!t.options?.length) continue
  const vals = t.options.map(optionValue)
  const { min, max } = getDigitRange(t)
  if (Math.min(...vals) !== min || Math.max(...vals) !== max) {
    // digitMin/Max override is ok
    if (t.digitMin === undefined) {
      warn(`${t.id}: options [${Math.min(...vals)}–${Math.max(...vals)}] vs range ${min}–${max}`)
    }
  }
}

// —— Report ——
console.log('\n=== РЕЗУЛЬТАТ QA ===')
console.log(`Ошибки: ${errors.length}`)
for (const e of errors) console.log('  ✗', e)
console.log(`Предупреждения: ${warnings.length}`)
for (const w of warnings) console.log('  !', w)

if (errors.length) {
  process.exitCode = 1
} else {
  console.log('\nВсе критические проверки пройдены.')
}
