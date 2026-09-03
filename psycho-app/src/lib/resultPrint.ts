import type { Specialist } from '../data/specialists'
import { getSpecialist } from '../data/specialists'
import { wippfScoreRatio, type WippfScaleScore } from './wippf'
import { buildWippfClientReport } from './wippfClient'
import type { VisualResultModel } from './visualResult'
import { escapeHtml, todayRu } from './utils'

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

function levelRu(level: string | undefined): string {
  if (level === 'low') return 'слабо / норма'
  if (level === 'moderate') return 'баланс / умеренно'
  if (level === 'high') return 'выражено'
  return 'ориентир'
}

function metricCells(model: VisualResultModel): string {
  if (!model.metrics?.length) return ''
  return `<div class="result-print-metrics">${model.metrics
    .map(
      (m) =>
        `<div class="result-print-metric">` +
        `<div class="rpm-name">${escapeHtml(m.name)}</div>` +
        `<div class="rpm-value">${escapeHtml(m.value)}</div>` +
        (m.hint ? `<div class="rpm-hint">${escapeHtml(m.hint)}</div>` : '') +
        `</div>`,
    )
    .join('')}</div>`
}

function focusList(model: VisualResultModel): string {
  if (!model.focus?.length) return ''
  return (
    `<div class="result-print-section"><h2>На что обратить внимание</h2><ul>` +
    model.focus
      .map(
        (f) =>
          `<li><strong>${escapeHtml(f.label)}</strong> — ${escapeHtml(f.value)}` +
          (f.hint ? `: ${escapeHtml(f.hint)}` : '') +
          `</li>`,
      )
      .join('') +
    `</ul></div>`
  )
}

function bipolarTrackHtml(score: number): string {
  const pct = (wippfScoreRatio(score) * 100).toFixed(2)
  return (
    `<div class="wippf-bi-track">` +
    `<span class="wippf-bi-zone wippf-bi-zone-low"></span>` +
    `<span class="wippf-bi-zone wippf-bi-zone-norm"></span>` +
    `<span class="wippf-bi-zone wippf-bi-zone-high"></span>` +
    `<i class="wippf-bi-marker" style="left:${pct}%"></i>` +
    `</div>`
  )
}

function bipolarBarHtml(score: number, lowLabel: string, highLabel: string): string {
  return (
    `<div class="wippf-bi-row">` +
    `<span class="wippf-bi-pole wippf-bi-pole-low">${escapeHtml(lowLabel)}</span>` +
    bipolarTrackHtml(score) +
    `<span class="wippf-bi-pole wippf-bi-pole-high">${escapeHtml(highLabel)}</span>` +
    `</div>`
  )
}

function wippfLegendHtml(): string {
  return (
    `<div class="wippf-legend">` +
    `<span class="wippf-legend-swatch low"></span><span>3–5 слабо</span>` +
    `<span class="wippf-legend-swatch norm"></span><span>6–9 баланс (норма)</span>` +
    `<span class="wippf-legend-swatch high"></span><span>10–12 выражено</span>` +
    `</div>`
  )
}

const GROUP_PRINT: { title: string; key: WippfScaleScore['group'] }[] = [
  { title: 'Вторичные способности', key: 'secondary' },
  { title: 'Первичные способности', key: 'primary' },
  { title: 'Реакции на конфликт', key: 'conflict' },
  { title: 'Модель отношений', key: 'model' },
]

function wippfBipolarBlocks(scales: WippfScaleScore[], withYouText?: Map<string, string>): string {
  return scales
    .map((s) => {
      const you = withYouText?.get(s.id)
      return (
        `<div class="wippf-bi rp-level-${s.level}">` +
        `<div class="wippf-bi-head">` +
        `<strong>${escapeHtml(s.code)} · ${escapeHtml(s.name)}</strong>` +
        `<span>${s.score}/12 · ${escapeHtml(s.flag)}</span>` +
        `</div>` +
        bipolarBarHtml(s.score, s.lowLabel, s.highLabel) +
        (you ? `<p class="wippf-bi-you">${escapeHtml(you)}</p>` : '') +
        `</div>`
      )
    })
    .join('')
}

function wippfTables(model: VisualResultModel): string {
  const report = model.wippf
  if (!report) return ''
  const groups: { title: string; ids: string[] }[] = [
    { title: 'Вторичные способности', ids: report.secondary.map((s) => s.id) },
    { title: 'Первичные способности', ids: report.primary.map((s) => s.id) },
    { title: 'Реакции на конфликт', ids: report.conflict.map((s) => s.id) },
    { title: 'Модель отношений', ids: report.model.map((s) => s.id) },
  ]
  const byId = Object.fromEntries(report.scales.map((s) => [s.id, s]))
  const tables = groups
    .map((g) => {
      const rows = g.ids
        .map((id) => byId[id])
        .filter(Boolean)
        .map((s) => {
          return (
            `<tr class="rp-level-${s!.level}">` +
            `<td class="rp-code">${escapeHtml(s!.code)}</td>` +
            `<td>${escapeHtml(s!.name)}<div class="rp-poles">${escapeHtml(s!.lowLabel)} ↔ ${escapeHtml(s!.highLabel)}</div></td>` +
            `<td class="rp-score">${s!.score}/12</td>` +
            `<td class="rp-flag">${escapeHtml(s!.flag)}</td>` +
            `<td class="rp-bi">${bipolarTrackHtml(s!.score)}</td>` +
            `</tr>`
          )
        })
        .join('')
      return (
        `<div class="result-print-section"><h2>${escapeHtml(g.title)}</h2>` +
        `<table class="result-print-table"><thead><tr>` +
        `<th>Код</th><th>Шкала</th><th>Балл</th><th>Зона</th><th>Полюса 3 ← норма 6–9 → 12</th>` +
        `</tr></thead><tbody>${rows}</tbody></table></div>`
      )
    })
    .join('')

  const aggRows = report.agg
    .map((a) => {
      const pct = Math.round(((a.value - a.min) / (a.max - a.min)) * 100)
      return (
        `<tr>` +
        `<td class="rp-code">${escapeHtml(a.id.toUpperCase())}</td>` +
        `<td>${escapeHtml(a.name)}</td>` +
        `<td class="rp-score">${a.value}/${a.max}</td>` +
        `<td>${escapeHtml(a.hint)}</td>` +
        `<td class="rp-bar"><span style="width:${pct}%"></span></td>` +
        `</tr>`
      )
    })
    .join('')

  const focusScales = report.extremes.length ? report.extremes.slice(0, 8) : report.conflict
  const interpBlocks = focusScales
    .map(
      (s) =>
        `<article class="result-print-interp rp-level-${s.level}">` +
        `<h3>${escapeHtml(s.code)} · ${escapeHtml(s.name)} — ${s.score}/12 (${escapeHtml(s.flag)})</h3>` +
        `<p class="rpi-meaning">${escapeHtml(s.meaning)}</p>` +
        `<p>${escapeHtml(s.interpretation)}</p>` +
        `<p class="rpi-rec"><strong>Рекомендация.</strong> ${escapeHtml(s.recommendation)}</p>` +
        `</article>`,
    )
    .join('')

  const recList = report.recommendations.length
    ? `<div class="result-print-section"><h2>Рекомендации по профилю</h2><ol class="result-print-recs">` +
      report.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join('') +
      `</ol></div>`
    : ''

  return (
    recList +
    (interpBlocks
      ? `<div class="result-print-section"><h2>Интерпретация шкал</h2>${interpBlocks}</div>`
      : '') +
    `<div class="result-print-section"><h2>Как читать шкалы</h2>${wippfLegendHtml()}` +
    `<p class="result-print-footnote" style="margin-top:0">Левый полюс 3–5 · зелёная норма 6–9 · правый полюс 10–12. Полюса не «хорошо/плохо».</p></div>` +
    tables +
    `<div class="result-print-section"><h2>Обобщённые измерения</h2>` +
    `<table class="result-print-table"><thead><tr>` +
    `<th>Код</th><th>Измерение</th><th>Балл</th><th>Пояснение</th><th>Профиль</th>` +
    `</tr></thead><tbody>${aggRows}</tbody></table></div>`
  )
}

function itemFallback(model: VisualResultModel): string {
  if (model.wippf || !model.items?.length) return ''
  const rows = model.items
    .map(
      (s) =>
        `<tr class="rp-level-${s.level || 'none'}">` +
        `<td class="rp-code">${escapeHtml(s.label)}</td>` +
        `<td class="rp-score">${escapeHtml(s.value)}</td>` +
        `<td>${escapeHtml(s.hint || '')}</td>` +
        `</tr>`,
    )
    .join('')
  return (
    `<div class="result-print-section"><h2>Показатели</h2>` +
    `<table class="result-print-table"><thead><tr><th>Шкала</th><th>Балл</th><th>Комментарий</th></tr></thead>` +
    `<tbody>${rows}</tbody></table></div>`
  )
}

/** Печать визуального результата теста (не бланка) */
export function printVisualResult(
  testLabel: string,
  model: VisualResultModel,
  specialist: Specialist = getSpecialist(undefined),
): void {
  const html =
    `<div class="result-print-sheet">` +
    `<header class="result-print-header">` +
    `<div class="result-print-mark">Результат</div>` +
    `<h1>${escapeHtml(testLabel)}</h1>` +
    `<div class="result-print-meta">` +
    `<span>${escapeHtml(todayRu())}</span>` +
    `<span>${escapeHtml(specialist.fullName)}</span>` +
    `</div></header>` +
    `<section class="result-print-verdict result-print-verdict-${model.level}">` +
    `<div class="rpv-label">Вывод · ${escapeHtml(levelRu(model.level))}</div>` +
    `<div class="rpv-title">${escapeHtml(model.verdict)}</div>` +
    (model.detail ? `<p>${escapeHtml(model.detail)}</p>` : '') +
    `</section>` +
    metricCells(model) +
    focusList(model) +
    wippfTables(model) +
    itemFallback(model) +
    (model.footnote
      ? `<p class="result-print-footnote">${escapeHtml(model.footnote)}</p>`
      : '') +
    `<footer class="result-print-footer">` +
    `<span>Скрининговый / терапевтический ориентир, не диагноз</span>` +
    `<span>${escapeHtml(specialist.shortName)}</span>` +
    `</footer></div>`

  runPrint(html)
}

/** Печать домашнего заключения для клиента (тёплый язык, без клинического жаргона) */
export function printClientResult(
  testLabel: string,
  model: VisualResultModel,
  specialist: Specialist = getSpecialist(undefined),
): void {
  const report = model.wippf
  if (!report) {
    printVisualResult(testLabel, model, specialist)
    return
  }
  const client = buildWippfClientReport(report)
  const youById = new Map(client.scales.map((s) => [s.id, s.youText]))
  const groups = GROUP_PRINT.map((g) => {
    const list = report.scales.filter((s) => s.group === g.key)
    return (
      `<div class="result-print-section">` +
      `<h2>${escapeHtml(g.title)}</h2>` +
      `<div class="wippf-bi-list">${wippfBipolarBlocks(list, youById)}</div>` +
      `</div>`
    )
  }).join('')
  const reflections =
    `<div class="result-print-section"><h2>О чём подумать дома</h2><ol class="result-print-recs">` +
    client.reflections.map((r) => `<li>${escapeHtml(r)}</li>`).join('') +
    `</ol></div>`

  const html =
    `<div class="result-print-sheet client-print-sheet">` +
    `<header class="result-print-header">` +
    `<div class="result-print-mark">Для самостоятельной работы</div>` +
    `<h1>${escapeHtml(testLabel)} — ваш профиль</h1>` +
    `<div class="result-print-meta">` +
    `<span>${escapeHtml(todayRu())}</span>` +
    `<span>${escapeHtml(specialist.fullName)}</span>` +
    `</div></header>` +
    `<section class="result-print-verdict result-print-verdict-${report.level}">` +
    `<div class="rpv-label">Как читать этот лист</div>` +
    `<p>${escapeHtml(client.lead)}</p>` +
    `<p>${escapeHtml(client.howToRead)}</p>` +
    `</section>` +
    `<section class="result-print-section">` +
    `<h2>Что видно в вашем профиле</h2>` +
    `<p>${escapeHtml(client.overall)}</p>` +
    `</section>` +
    wippfLegendHtml() +
    groups +
    reflections +
    `<p class="result-print-footnote">` +
    `Это материал для размышления, не диагноз и не оценка «хороший / плохой». ` +
    `Если что-то зацепило — принесите это на встречу.` +
    `</p>` +
    `<footer class="result-print-footer">` +
    `<span>Домашнее заключение · WIPPF 2.0</span>` +
    `<span>${escapeHtml(specialist.shortName)}</span>` +
    `</footer></div>`

  runPrint(html)
}
