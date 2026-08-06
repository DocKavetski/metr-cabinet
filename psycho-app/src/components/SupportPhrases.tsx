import { useEffect, useRef, useState, type CSSProperties } from 'react'

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

const SLOTS = [
  { top: '2%', left: '4%', width: '78%' },
  { top: '16%', left: '18%', width: '72%' },
  { top: '31%', left: '2%', width: '74%' },
  { top: '48%', left: '14%', width: '76%' },
  { top: '65%', left: '6%', width: '70%' },
  { top: '79%', left: '20%', width: '68%' },
] as const

interface Bubble {
  id: number
  phrase: string
  slot: (typeof SLOTS)[number]
  tone: 'signal' | 'measure' | 'accent'
  tail: 'left' | 'right'
  tilt: string
}

export function SupportPhrases() {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const phraseIndex = useRef(0)
  const slotIndex = useRef(0)
  const nextId = useRef(1)

  useEffect(() => {
    const tones: Bubble['tone'][] = ['signal', 'measure', 'accent']

    const spawn = () => {
      const id = nextId.current++
      const phrase = PHRASES[phraseIndex.current % PHRASES.length]
      const slot = SLOTS[slotIndex.current % SLOTS.length]
      const tone = tones[id % tones.length]
      const tail: Bubble['tail'] = id % 2 === 0 ? 'right' : 'left'
      const tilt = ['-2deg', '1.5deg', '-1deg', '2deg'][id % 4]

      phraseIndex.current += 1
      slotIndex.current += 1

      setBubbles((prev) => [...prev.slice(-3), { id, phrase, slot, tone, tail, tilt }])

      window.setTimeout(() => {
        setBubbles((prev) => prev.filter((bubble) => bubble.id !== id))
      }, 6400)
    }

    spawn()
    const timer = window.setInterval(spawn, 30000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <aside className="support-phrases no-print" aria-label="Поддерживающие фразы">
      <div className="support-phrases-stage">
        <div className="support-phrases-glow support-phrases-glow-1" aria-hidden />
        <div className="support-phrases-glow support-phrases-glow-2" aria-hidden />
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            className={`support-bubble support-bubble-${bubble.tone} support-bubble-tail-${bubble.tail}`}
            style={
              {
                top: bubble.slot.top,
                left: bubble.slot.left,
                width: bubble.slot.width,
                '--bubble-tilt': bubble.tilt,
              } as CSSProperties
            }
          >
            <span>{bubble.phrase}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
