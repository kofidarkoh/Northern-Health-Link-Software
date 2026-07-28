import { useEffect, useRef, useCallback } from 'react'
import { AppState, AppStateStatus } from 'react-native'

const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

export function useSessionTimeout(onTimeout: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const appState = useRef(AppState.currentState)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onTimeout()
    }, TIMEOUT_MS)
  }, [onTimeout])

  useEffect(() => {
    resetTimer()

    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        resetTimer()
      }
      appState.current = nextState
    })

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      sub.remove()
    }
  }, [resetTimer])
}
