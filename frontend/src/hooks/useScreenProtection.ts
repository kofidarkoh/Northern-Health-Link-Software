import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus, Platform } from 'react-native'
import * as ScreenCapture from 'expo-screen-capture'

export function useScreenProtection(enabled = true) {
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return

    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && appState.current.match(/inactive|background/)) {
        ScreenCapture.preventScreenCaptureAsync().catch(() => {})
      }
      appState.current = nextState
    })

    return () => {
      sub.remove()
      ScreenCapture.allowScreenCaptureAsync().catch(() => {})
    }
  }, [enabled])
}
