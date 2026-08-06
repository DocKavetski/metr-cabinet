import { defaultSpecialistId, specialists } from '../data/specialists'
import type { AppState } from '../types'

const KEY = 'psych_tests_react_v2'
/** One-time: pin HADS + ASQ in «Частые» for existing localStorage users */
const STAR_HADS_ASQ_KEY = 'psych_tests_star_hads_asq_v1'

const defaults: AppState = {
  answers: {},
  globalResults: [],
  inputMode: 'string',
  theme: 'light',
  currentTestId: 'bdi',
  favoriteIds: ['hads', 'asq', 'phq9', 'gad7', 'asrs', 'aq10'],
  recentIds: [],
  specialistId: defaultSpecialistId,
}

function pinHadsAsqOnce(ids: string[]): string[] {
  try {
    if (localStorage.getItem(STAR_HADS_ASQ_KEY) === '1') return ids
    localStorage.setItem(STAR_HADS_ASQ_KEY, '1')
  } catch {
    /* private mode */
  }
  const out = [...ids]
  for (const id of ['hads', 'asq'] as const) {
    if (!out.includes(id)) out.unshift(id)
  }
  return out.slice(0, 24)
}

function uniqIds(ids: unknown, max = 24): string[] {
  if (!Array.isArray(ids)) return []
  const out: string[] = []
  for (const id of ids) {
    if (typeof id !== 'string' || !id || out.includes(id)) continue
    out.push(id)
    if (out.length >= max) break
  }
  return out
}

function resolveSpecialistId(id: unknown): string {
  if (typeof id === 'string' && specialists.some((s) => s.id === id)) return id
  return defaultSpecialistId
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...defaults, favoriteIds: [...defaults.favoriteIds] }
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      answers: parsed.answers ?? {},
      globalResults: parsed.globalResults ?? [],
      inputMode: parsed.inputMode === 'radio' ? 'radio' : 'string',
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      currentTestId: parsed.currentTestId || 'bdi',
      favoriteIds: pinHadsAsqOnce(
        parsed.favoriteIds !== undefined
          ? uniqIds(parsed.favoriteIds)
          : [...defaults.favoriteIds],
      ),
      recentIds: uniqIds(parsed.recentIds, 8),
      specialistId: resolveSpecialistId(parsed.specialistId),
    }
  } catch {
    return { ...defaults, favoriteIds: pinHadsAsqOnce([...defaults.favoriteIds]) }
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        answers: state.answers,
        globalResults: state.globalResults,
        inputMode: state.inputMode,
        theme: state.theme,
        currentTestId: state.currentTestId,
        favoriteIds: state.favoriteIds,
        recentIds: state.recentIds,
        specialistId: state.specialistId,
      }),
    )
  } catch {
    /* quota / private mode */
  }
}

export function pushRecent(recentIds: string[], id: string, max = 6): string[] {
  return [id, ...recentIds.filter((x) => x !== id)].slice(0, max)
}
