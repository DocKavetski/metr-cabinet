import { defaultSpecialistId, specialists } from '../data/specialists'
import type { AppState } from '../types'

const KEY = 'psych_tests_react_v2'

const defaults: AppState = {
  answers: {},
  globalResults: [],
  inputMode: 'string',
  theme: 'light',
  currentTestId: 'bdi',
  specialistId: defaultSpecialistId,
}

function resolveSpecialistId(id: unknown): string {
  if (typeof id === 'string' && specialists.some((s) => s.id === id)) return id
  return defaultSpecialistId
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...defaults }
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      answers: parsed.answers ?? {},
      globalResults: parsed.globalResults ?? [],
      inputMode: parsed.inputMode === 'radio' ? 'radio' : 'string',
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      currentTestId: parsed.currentTestId || 'bdi',
      specialistId: resolveSpecialistId(parsed.specialistId),
    }
  } catch {
    return { ...defaults }
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
        specialistId: state.specialistId,
      }),
    )
  } catch {
    /* quota / private mode */
  }
}
