import { useEffect, useRef, useCallback, useState } from 'react'
import { AppState, AppStateStatus, Platform } from 'react-native'
import * as LocalAuthentication from 'expo-local-authentication'

const BACKGROUND_TIMEOUT_MS = 5 * 1000 // 5 seconds in background triggers re-auth

interface UseBackgroundAuthOptions {
  enabled?: boolean
  promptMessage?: string
  onAuthRequired?: () => void
}

export function useBackgroundAuth(options: UseBackgroundAuthOptions = {}) {
  const { enabled = true, promptMessage = 'Authenticate to continue', onAuthRequired } = options
  const appState = useRef(AppState.currentState)
  const backgroundTime = useRef<number | null>(null)
  const [needsAuth, setNeedsAuth] = useState(false)

  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') return true

      const compatible = await LocalAuthentication.hasHardwareAsync()
      if (!compatible) return true

      const enrolled = await LocalAuthentication.isEnrolledAsync()
      if (!enrolled) return true

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      })

      return result.success
    } catch (error) {
      console.warn('[BackgroundAuth] Error:', error)
      return true
    }
  }, [promptMessage])

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return

    const sub = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (appState.current === 'active' && nextState.match(/inactive|background/)) {
        backgroundTime.current = Date.now()
      }

      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        if (backgroundTime.current) {
          const elapsed = Date.now() - backgroundTime.current
          if (elapsed > BACKGROUND_TIMEOUT_MS) {
            setNeedsAuth(true)
            const success = await authenticate()
            if (!success) {
              onAuthRequired?.()
            }
            setNeedsAuth(false)
          }
        }
        backgroundTime.current = null
      }

      appState.current = nextState
    })

    return () => sub.remove()
  }, [enabled, authenticate, onAuthRequired])

  return { needsAuth, authenticate }
}
