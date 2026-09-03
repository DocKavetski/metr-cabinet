import type { VisualItem, VisualResultModel } from '../lib/visualResult'
import type { WippfReport, WippfScaleScore } from '../lib/wippf'
import { wippfScoreRatio } from '../lib/wippf'
import { buildWippfClientReport } from '../lib/wippfClient'

const GROUP_LABEL: Record<WippfScaleScore['group'], string> = {
  secondary: 'Вторичные способности (нормы)',
  primary: 'Первичные способности (эмоции / отношения)',
  conflict: 'Реакции на конфликт',
  model: 'Модель отношений',
}

function ScaleBar({ item }: { item: VisualItem }) {
  const pct = Math.max(0, Math.min(100, Math.round((item.ratio ?? 0) * 100)))
  return (
    <div className={`visual-scale visual-scale-bar level-${item.level || 'none'}`}>
      <span className="visual-scale-code">{item.label}</span>
      <span className="visual-scale-mean">{item.value}</span>
      {item.hint ? <span className="visual-scale-flag">{item.hint}</span> : null}
      <div className="visual-scale-track" aria-hidden>
        <i style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function WippfBipolarRow({ scale }: { scale: WippfScaleScore }) {
  const pct = wippfScoreRatio(scale.score) * 100
  return (
    <div className={`wippf-bi level-${scale.level}`}>
      <div className="wippf-bi-head">
        <strong>
          {scale.code} · {scale.name}
        </strong>
        <span>
          {scale.score}/12 · {scale.flag}
        </span>
      </div>
      <div className="wippf-bi-row">
        <span className="wippf-bi-pole wippf-bi-pole-low">{scale.lowLabel}</span>
        <div
          className="wippf-bi-track"
          role="img"
          aria-label={`${scale.name}: ${scale.score} из 12, ${scale.lowLabel} — ${scale.highLabel}`}
        >
          <span className="wippf-bi-zone wippf-bi-zone-low" />
          <span className="wippf-bi-zone wippf-bi-zone-norm" title="Условная норма 6–9" />
          <span className="wippf-bi-zone wippf-bi-zone-high" />
          <i className="wippf-bi-marker" style={{ left: `${pct}%` }} />
        </div>
        <span className="wippf-bi-pole wippf-bi-pole-high">{scale.highLabel}</span>
      </div>
      <div className="wippf-bi-axis" aria-hidden>
        <span>3</span>
        <span>6</span>
        <span className="wippf-bi-axis-norm">норма 6–9</span>
        <span>9</span>
        <span>12</span>
      </div>
    </div>
  )
}

function WippfLegend() {
  return (
    <div className="wippf-legend" aria-hidden>
      <span className="wippf-legend-swatch low" />
      <span>3–5 слабо (левый полюс)</span>
      <span className="wippf-legend-swatch norm" />
      <span>6–9 баланс</span>
      <span className="wippf-legend-swatch high" />
      <span>10–12 выражено (правый полюс)</span>
    </div>
  )
}

function WippfInterpCards({ report }: { report: WippfReport }) {
  const focus = report.extremes.length ? report.extremes : report.scales.filter((s) => s.group === 'conflict')
  const list = focus.slice(0, 8)
  if (!list.length) return null
  return (
    <div className="wippf-interp">
      <div className="visual-scales-label">
        {report.extremes.length ? 'Интерпретация крайних шкал' : 'Интерпретация конфликтных реакций'}
      </div>
      <div className="wippf-interp-list">
        {list.map((s) => (
          <article key={s.id} className={`wippf-interp-card level-${s.level}`}>
            <header>
              <strong>
                {s.code} · {s.name}
              </strong>
              <span>
                {s.score}/12 · {s.flag} · {s.lowLabel} ↔ {s.highLabel}
              </span>
            </header>
            <p className="wippf-interp-meaning">{s.meaning}</p>
            <p className="wippf-interp-text">{s.interpretation}</p>
            <p className="wippf-interp-rec">
              <span>Рекомендация.</span> {s.recommendation}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}

function WippfRecommendations({ report }: { report: WippfReport }) {
  if (!report.recommendations.length) return null
  return (
    <div className="wippf-recs">
      <div className="visual-scales-label">Рекомендации по профилю</div>
      <ol className="wippf-recs-list">
        {report.recommendations.map((r, idx) => (
          <li key={idx}>{r}</li>
        ))}
      </ol>
    </div>
  )
}

function WippfClientPreview({ report }: { report: WippfReport }) {
  const client = buildWippfClientReport(report)
  return (
    <div className="wippf-client-preview">
      <div className="visual-scales-label">Как это звучит для клиента</div>
      <p className="wippf-client-lead">{client.overall}</p>
    </div>
  )
}

function WippfGroups({ report }: { report: WippfReport }) {
  const groups: WippfScaleScore['group'][] = ['secondary', 'primary', 'conflict', 'model']
  return (
    <div className="wippf-groups">
      <WippfLegend />
      {groups.map((g) => {
        const list = report.scales.filter((s) => s.group === g)
        return (
          <div key={g} className="wippf-group">
            <div className="visual-scales-label">{GROUP_LABEL[g]}</div>
            <div className="wippf-bi-list">
              {list.map((s) => (
                <WippfBipolarRow key={s.id} scale={s} />
              ))}
            </div>
          </div>
        )
      })}
      <div className="wippf-group">
        <div className="visual-scales-label">Обобщённые измерения</div>
        <div className="visual-scale-grid wippf-agg-grid">
          {report.agg.map((a) => (
            <ScaleBar
              key={a.id}
              item={{
                label: a.id.toUpperCase(),
                value: `${a.value}/${a.max}`,
                hint: `${a.name} · ${a.hint}`,
                ratio: (a.value - a.min) / (a.max - a.min),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function VisualResult({ model }: { model: VisualResultModel }) {
  const level = model.level || 'none'
  const showItemGrid =
    Boolean(model.scl90) ||
    Boolean(model.items && model.items.length > 0 && !(model.metrics && model.metrics.length >= 2) && !model.wippf)

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

      {model.focus && model.focus.length > 0 && !model.wippf && (
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

      {model.wippf ? <WippfClientPreview report={model.wippf} /> : null}
      {model.wippf ? <WippfRecommendations report={model.wippf} /> : null}
      {model.wippf ? <WippfInterpCards report={model.wippf} /> : null}
      {model.wippf ? <WippfGroups report={model.wippf} /> : null}

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
