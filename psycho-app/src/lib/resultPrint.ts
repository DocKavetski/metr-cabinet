import type { Specialist } from '../data/specialists'
import { getSpecialist } from '../data/specialists'
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
          const pct = Math.round(((s!.score - 3) / 9) * 100)
          return (
            `<tr class="rp-level-${s!.level}">` +
            `<td class="rp-code">${escapeHtml(s!.code)}</td>` +
            `<td>${escapeHtml(s!.name)}</td>` +
            `<td class="rp-score">${s!.score}/12</td>` +
            `<td class="rp-flag">${escapeHtml(s!.flag)}</td>` +
            `<td class="rp-bar"><span style="width:${pct}%"></span></td>` +
            `</tr>`
          )
        })
        .join('')
      return (
        `<div class="result-print-section"><h2>${escapeHtml(g.title)}</h2>` +
        `<table class="result-print-table"><thead><tr>` +
        `<th>Код</th><th>Шкала</th><th>Балл</th><th>Полюс</th><th>Профиль</th>` +
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

  return (
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
