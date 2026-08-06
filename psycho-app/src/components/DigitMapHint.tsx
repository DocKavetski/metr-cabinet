export function DigitMapHint({
  digits,
  len,
  cursorPos,
}: {
  digits: string
  len: number
  cursorPos: number
}) {
  if (len <= 0) return null
  const pos = Math.min(Math.max(cursorPos, 0), digits.length)
  const focusItem = pos > 0 ? pos : digits.length > 0 ? digits.length : 1
  const filled = digits.length
  return (
    <div className="digit-map no-print">
      <div>
        Пункт <strong>№{Math.min(focusItem, len)}</strong> ={' '}
        <strong>{Math.min(focusItem, len)}-я</strong> цифра в строке.
        {filled > 0 && filled < len && (
          <>
            {' '}
            Заполнено {filled}/{len}; следующий — пункт <strong>№{filled + 1}</strong>.
          </>
        )}
        {filled === len && <> Строка полная ({len}/{len}).</>}
      </div>
      <div className="digit-map-hint">
        Можно вставлять с пробелами: <code>1 2 0 3</code> — лишнее удалится само.
      </div>
    </div>
  )
}
