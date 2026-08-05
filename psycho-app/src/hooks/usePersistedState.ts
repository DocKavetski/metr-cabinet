import { useEffect, useState } from 'react'
import { loadState, saveState } from '../lib/storage'
import type { AppState } from '../types'

export function usePersistedState() {
  const [state, setState] = useState<AppState>(() => loadState())
  useEffect(() => {
    saveState(state)
  }, [state])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme)
  }, [state.theme])
  return [state, setState] as const
}
