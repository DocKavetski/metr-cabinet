import type { AppState } from '../types'

const KEY = 'psych_tests_react_v2'

const defaults: AppState = {
  answers: {},
  globalResults: [],
  inputMode: 'string',
  theme: 'light',
  currentTestId: 'bdi',
  favoriteIds: ['phq9', 'gad7', 'asrs', 'aq10', 'asq'],
  recentIds: [],
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
      favoriteIds:
        parsed.favoriteIds !== undefined
          ? uniqIds(parsed.favoriteIds)
          : [...defaults.favoriteIds],
      recentIds: uniqIds(parsed.recentIds, 8),
    }
  } catch {
    return { ...defaults, favoriteIds: [...defaults.favoriteIds] }
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
      }),
    )
  } catch {
    /* quota / private mode */
  }
}

export function pushRecent(recentIds: string[], id: string, max = 6): string[] {
  return [id, ...recentIds.filter((x) => x !== id)].slice(0, max)
}
