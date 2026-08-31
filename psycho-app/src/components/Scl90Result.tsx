import type { Scl90Report } from '../lib/scl90'

const levelWord: Record<string, string> = {
  low: 'норма',
  moderate: 'повышено',
  high: 'высокий',
}

export function Scl90Result({ report }: { report: Scl90Report }) {
  return (
    <div className={`result-area scl90-result level-${report.level}`}>
      <div className={`scl90-verdict scl90-verdict-${report.level}`}>
        <div className="scl90-verdict-label">Вывод</div>
        <div className="scl90-verdict-title">{report.verdict}</div>
        <p className="scl90-verdict-text">{report.conclusion}</p>
      </div>

      <div className="scl90-indices">
        <div className="scl90-index">
          <span className="scl90-index-name">GSI</span>
          <span className="scl90-index-value">{report.gsi.toFixed(2)}</span>
          <span className="scl90-index-hint">общий индекс тяжести · {levelWord[report.level]}</span>
        </div>
        <div className="scl90-index">
          <span className="scl90-index-name">PST</span>
          <span className="scl90-index-value">
            {report.pst}
            <small>/90</small>
          </span>
          <span className="scl90-index-hint">сколько симптомов отмечено</span>
        </div>
        <div className="scl90-index">
          <span className="scl90-index-name">PSDI</span>
          <span className="scl90-index-value">{report.psdi.toFixed(2)}</span>
          <span className="scl90-index-hint">средняя сила отмеченных симптомов</span>
        </div>
      </div>

      {report.elevated.length > 0 && (
        <div className="scl90-focus">
          <div className="scl90-focus-label">На что обратить внимание</div>
          <ul className="scl90-focus-list">
            {report.elevated.map((s) => (
              <li key={s.id} className={`scl90-focus-item level-${s.level}`}>
                <strong>
                  {s.code} · {s.name}
                </strong>
                <span>
                  {s.mean.toFixed(2)} — {s.flag} ({s.short})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="scl90-scales">
        <div className="scl90-scales-label">Все шкалы (средние 0–4)</div>
        <div className="scl90-scale-grid">
          {report.scales.map((s) => (
            <div key={s.id} className={`scl90-scale level-${s.level}`}>
              <span className="scl90-scale-code">{s.code}</span>
              <span className="scl90-scale-mean">{s.mean.toFixed(2)}</span>
              <span className="scl90-scale-flag">{s.flag}</span>
              <span className="scl90-scale-name">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="scl90-footnote">
        Ориентиры кабинета: &lt;0,7 — норма; ≥0,7 — повышено; ≥1,5 — высоко. Ответы 1–5 переводятся в
        шкалу 0–4. Не заменяет клинический диагноз и нормы вашей адаптации.
      </p>
    </div>
  )
}
