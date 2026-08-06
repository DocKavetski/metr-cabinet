import { useEffect, useMemo, useState } from 'react'
import { allTests, categoryOrder, getTest } from '../data'
import { testMatchesQuery } from '../data/search'
import { isAnswerComplete } from '../lib/answers'
import type { TestConfig } from '../types'

export function Sidebar({
  currentId,
  onSelect,
  packMode,
  packIds,
  onTogglePack,
  favoriteIds,
  onToggleFavorite,
  recentIds,
  answers,
}: {
  currentId: string
  onSelect: (id: string) => void
  packMode: boolean
  packIds: Set<string>
  onTogglePack: (id: string) => void
  favoriteIds: string[]
  onToggleFavorite: (id: string) => void
  recentIds: string[]
  answers: Record<string, string>
}) {
  const [query, setQuery] = useState('')
  const q = query.trim()
  const currentCat = getTest(currentId)?.category

  const [openCats, setOpenCats] = useState<Set<string>>(() =>
    currentCat ? new Set([currentCat]) : new Set(),
  )

  useEffect(() => {
    if (!currentCat || q) return
    setOpenCats((prev) => {
      if (prev.has(currentCat)) return prev
      const next = new Set(prev)
      next.add(currentCat)
      return next
    })
  }, [currentCat, q])

  const favorites = useMemo(
    () => favoriteIds.map((id) => getTest(id)).filter(Boolean) as TestConfig[],
    [favoriteIds],
  )
  const recents = useMemo(
    () =>
      recentIds
        .filter((id) => id !== currentId && !favoriteIds.includes(id))
        .map((id) => getTest(id))
        .filter(Boolean) as TestConfig[],
    [recentIds, currentId, favoriteIds],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, TestConfig[]>()
    for (const t of allTests) {
      if (!testMatchesQuery(t, q)) continue
      if (!map.has(t.category)) map.set(t.category, [])
      map.get(t.category)!.push(t)
    }
    const ordered: { category: string; tests: TestConfig[] }[] = categoryOrder
      .filter((c) => map.has(c))
      .map((c) => ({ category: c, tests: map.get(c)! }))
    for (const [category, tests] of map) {
      if (!(categoryOrder as readonly string[]).includes(category)) {
        ordered.push({ category, tests })
      }
    }
    return ordered
  }, [q])

  const totalShown = grouped.reduce((n, g) => n + g.tests.length, 0)
  const searching = q.length > 0

  const toggleCat = (cat: string) => {
    setOpenCats((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const renderRow = (t: TestConfig) => {
    const done = isAnswerComplete(t, answers[t.id] || '')
    const fav = favoriteIds.includes(t.id)
    return (
      <div key={t.id} className={`sidebar-row${t.id === currentId ? ' active' : ''}${done ? ' done' : ''}`}>
        {packMode && (
          <input
            type="checkbox"
            className="pack-check"
            checked={packIds.has(t.id)}
            onChange={() => onTogglePack(t.id)}
            title="В пакет печати"
          />
        )}
        <button
          type="button"
          className={`sidebar-fav${fav ? ' on' : ''}`}
          title={fav ? 'Убрать из частых' : 'В частые'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(t.id)
          }}
        >
          ★
        </button>
        <button type="button" className="sidebar-item" onClick={() => onSelect(t.id)}>
          <span className="sidebar-item-label">{t.label}</span>
          {done && <span className="sidebar-done">✓</span>}
        </button>
      </div>
    )
  }

  return (
    <aside className="sidebar no-print">
      <div className="sidebar-head">
        <div className="sidebar-brand">
          МЕТР <em>кабинет</em>
        </div>
        <p className="sidebar-tag">Шкалы · бланки · расчёт для приёма</p>
        <div className="sidebar-search">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск: phq, сдвг, сон…"
            aria-label="Поиск шкалы"
          />
        </div>
      </div>
      {packMode && (
        <p className="sidebar-note">Пакет: отметьте методики слева, затем «Печать» сверху.</p>
      )}
      <div className="sidebar-scroll">
        {!searching && favorites.length > 0 && (
          <div className="sidebar-group">
            <div className="sidebar-category sidebar-category-static">Частые</div>
            {favorites.map(renderRow)}
          </div>
        )}
        {!searching && recents.length > 0 && (
          <div className="sidebar-group">
            <div className="sidebar-category sidebar-category-static">Недавние</div>
            {recents.map(renderRow)}
          </div>
        )}

        {totalShown === 0 && <p className="sidebar-note">Ничего не найдено.</p>}
        {grouped.map((g) => {
          const open = searching || openCats.has(g.category)
          return (
            <div key={g.category} className="sidebar-group">
              <button
                type="button"
                className={`sidebar-category sidebar-category-toggle${open ? ' open' : ''}`}
                onClick={() => toggleCat(g.category)}
                aria-expanded={open}
              >
                <span>{g.category}</span>
                <span className="sidebar-cat-meta">
                  {g.tests.length}
                  <i aria-hidden>{open ? '▾' : '▸'}</i>
                </span>
              </button>
              {open && g.tests.map(renderRow)}
            </div>
          )
        })}
      </div>
      <div className="sidebar-foot">
        {searching ? `${totalShown} из ${allTests.length}` : `${allTests.length} шкал · свёртка категорий`}
      </div>
    </aside>
  )
}
