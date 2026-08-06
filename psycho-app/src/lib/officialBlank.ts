import type { FreeBlankInfo } from '../data/freeBlanks'
import type { Option, TestConfig } from '../types'
import { escapeHtml, optionLabel, optionValue } from './utils'

function optHeaders(opts: Option[]): { values: number[]; labels: string[] } {
  const values = opts.map(optionValue)
  const labels = opts.map((o) => {
    const lab = optionLabel(o).replace(/^\d+\s*[—–-]\s*/, '').trim()
    return lab.length > 28 ? String(optionValue(o)) : lab
  })
  return { values, labels }
}

/** Таблица в духе PHQ/GAD: вопрос + колонки баллов */
export function buildFreeOfficialTableBlank(
  test: TestConfig,
  specialistFooter: string,
  meta: FreeBlankInfo,
  extras: string = '',
): string {
  const questions = test.questions || []
  const opts = test.options || [0, 1, 2, 3]
  const { values, labels } = optHeaders(opts)

  const head = labels
    .map((lab, i) => `<th class="off-score"><span class="off-val">${values[i]}</span><span class="off-lab">${escapeHtml(lab)}</span></th>`)
    .join('')

  const rows = questions
    .map((q, i) => {
      const cells = values.map(() => `<td class="off-cell"><i></i></td>`).join('')
      return `<tr>
        <td class="off-num">${i + 1}</td>
        <td class="off-q">${escapeHtml(q)}</td>
        ${cells}
      </tr>`
    })
    .join('')

  return `<div class="blank-sheet blank-official">
  <div class="blank-official-banner">
    <span>Официальная свободная форма</span>
    <span>${escapeHtml(meta.source)}</span>
  </div>
  <div class="blank-header">
    <h1>${escapeHtml(test.label)}</h1>
    <p class="blank-instruction">${escapeHtml(
      test.blankInstruction ||
        (test.id === 'phq9' || test.id === 'gad7'
          ? 'За последние 2 недели как часто вас беспокоили следующие проблемы? Отметьте один ответ в каждом пункте.'
          : 'Отметьте один ответ в каждом пункте (крестик ✕ или закрасьте кружок).'),
    )}</p>
  </div>
  <table class="blank-official-table">
    <thead>
      <tr>
        <th class="off-num">№</th>
        <th class="off-q">Утверждение</th>
        ${head}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  ${extras}
  <p class="blank-attribution">${escapeHtml(meta.attribution)}</p>
  ${specialistFooter}
</div>`
}

/** ASQ: 4+острота, да/нет */
export function buildFreeAsqBlank(
  test: TestConfig,
  specialistFooter: string,
  meta: FreeBlankInfo,
): string {
  const qs = (test.questions || []).slice(0, 4)
  const yn = [0, 1]
    .map((v) => `<span class="blank-circle"><i></i>${v}</span>`)
    .join('')
  const rows = qs
    .map(
      (q, i) => `<div class="blank-item">
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

  return `<div class="blank-sheet blank-official">
  <div class="blank-official-banner">
    <span>Официальная свободная форма</span>
    <span>${escapeHtml(meta.source)}</span>
  </div>
  <div class="blank-header">
    <h1>${escapeHtml(test.label)}</h1>
    <p class="blank-instruction">${escapeHtml(
      test.blankInstruction || '0 — Нет · 1 — Да. Отметьте один ответ на пункт.',
    )}</p>
  </div>
  <p class="blank-legend">0 — Нет · 1 — Да</p>
  ${rows}${acuity}
  <p class="blank-attribution">${escapeHtml(meta.attribution)}</p>
  ${specialistFooter}
</div>`
}

export function phqDifficultyExtra(): string {
  return `<div class="blank-phq-difficulty">
  <p><strong>Если вы отметили какие‑либо проблемы</strong>, насколько трудно из‑за них было выполнять работу, вести домашние дела или ладить с людьми?</p>
  <div class="blank-phq-difficulty-opts">
    <span><i></i> Совсем не трудно</span>
    <span><i></i> Несколько трудно</span>
    <span><i></i> Очень трудно</span>
    <span><i></i> Крайне трудно</span>
  </div>
</div>`
}
