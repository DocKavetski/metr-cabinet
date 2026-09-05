import type { VisualResultModel } from '../lib/visualResult'

export function VisualResult({ model }: { model: VisualResultModel }) {
  const level = model.level || 'none'
  const showItemGrid =
    Boolean(model.scl90) ||
    Boolean(model.items && model.items.length > 0 && !(model.metrics && model.metrics.length >= 2))

  return (
    <div className={`result-area visual-result level-${level}`}>
      <div className={`visual-verdict visual-verdict-${level}`}>
        <div className="visual-verdict-label">Вывод</div>
        <div className="visual-verdict-title">{model.verdict}</div>
        {model.detail ? <p className="visual-verdict-text">{model.detail}</p> : null}
      </div>

      {model.metrics && model.metrics.length > 0 && (
        <div
          className="visual-indices"
          style={{ gridTemplateColumns: `repeat(${Math.min(4, model.metrics.length)}, minmax(0, 1fr))` }}
        >
          {model.metrics.map((m) => (
            <div key={`${m.name}-${m.value}`} className={`visual-index${m.level ? ` level-${m.level}` : ''}`}>
              <span className="visual-index-name">{m.name}</span>
              <span className="visual-index-value">{m.value}</span>
              {m.hint ? <span className="visual-index-hint">{m.hint}</span> : null}
            </div>
          ))}
        </div>
      )}

      {model.focus && model.focus.length > 0 && (
        <div className="visual-focus">
          <div className="visual-focus-label">На что обратить внимание</div>
          <ul className="visual-focus-list">
            {model.focus.map((item) => (
              <li
                key={`${item.label}-${item.value}`}
                className={`visual-focus-item level-${item.level || 'moderate'}`}
              >
                <strong>{item.label}</strong>
                <span>
                  {item.value}
                  {item.hint ? ` — ${item.hint}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showItemGrid && model.scl90 && (
        <div className="visual-scales">
          <div className="visual-scales-label">Все шкалы (средние 0–4)</div>
          <div className="visual-scale-grid">
            {model.scl90.scales.map((s) => (
              <div key={s.id} className={`visual-scale level-${s.level}`}>
                <span className="visual-scale-code">{s.code}</span>
                <span className="visual-scale-mean">{s.mean.toFixed(2)}</span>
                <span className="visual-scale-flag">{s.flag}</span>
                <span className="visual-scale-name">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showItemGrid && !model.scl90 && model.items && (
        <div className="visual-scales">
          <div className="visual-scales-label">Показатели</div>
          <div className="visual-scale-grid">
            {model.items.map((s) => (
              <div key={`${s.label}-${s.value}`} className={`visual-scale level-${s.level || 'none'}`}>
                <span className="visual-scale-code">{s.label}</span>
                <span className="visual-scale-mean">{s.value}</span>
                {s.hint ? <span className="visual-scale-flag">{s.hint}</span> : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {model.footnote ? <p className="visual-footnote">{model.footnote}</p> : null}
    </div>
  )
}
