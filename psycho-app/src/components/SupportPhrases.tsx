import { useEffect, useMemo, useState } from 'react'

const PHRASES = [
  'Ты — космос.',
  'Осталось чуть-чуть.',
  'Нужно просто потерпеть.',
  'У тебя всё получится.',
  'Ты молодец.',
  'Ты справляешься лучше, чем кажется.',
  'Спокойно: шаг за шагом, и всё сложится.',
  'У тебя уже многое получилось.',
] as const

export function SupportPhrases() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % PHRASES.length)
    }, 4200)
    return () => window.clearInterval(timer)
  }, [])

  const active = PHRASES[index]
  const preview = useMemo(
    () => [PHRASES[(index + 1) % PHRASES.length], PHRASES[(index + 2) % PHRASES.length]],
    [index],
  )

  return (
    <aside className="support-phrases no-print" aria-label="Поддерживающие фразы">
      <div className="support-phrases-card">
        <div className="support-phrases-kicker">Поддержка</div>
        <div className="support-phrases-quote">“{active}”</div>
        <div className="support-phrases-list">
          {preview.map((phrase) => (
            <div key={phrase} className="support-phrases-item">
              {phrase}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
