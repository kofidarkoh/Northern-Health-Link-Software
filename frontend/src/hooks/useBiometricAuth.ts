import { useState, useCallback } from 'react'
import * as LocalAuthentication from 'expo-local-authentication'
import { Alert } from 'react-native'

interface UseBiometricAuthOptions {
  promptMessage?: string
  cancelLabel?: string
  fallbackLabel?: string
}

interface UseBiometricAuthReturn {
  authenticate: () => Promise<boolean>
  isAvailable: boolean
  isLoading: boolean
}

export function useBiometricAuth(options?: UseBiometricAuthOptions): UseBiometricAuthReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [isAvailable, setIsAvailable] = useState(true)

  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true)

      const compatible = await LocalAuthentication.hasHardwareAsync()
      if (!compatible) {
        setIsAvailable(false)
        return true
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync()
      if (!enrolled) {
        setIsAvailable(false)
        return true
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options?.promptMessage || 'Authenticate to continue',
        cancelLabel: options?.cancelLabel || 'Cancel',
        fallbackLabel: options?.fallbackLabel || 'Use Passcode',
        disableDeviceFallback: false,
      })

      return result.success
    } catch (error) {
      console.warn('[BiometricAuth] Error:', error)
      return true
    } finally {
      setIsLoading(false)
    }
  }, [options?.promptMessage, options?.cancelLabel, options?.fallbackLabel])

  return { authenticate, isAvailable, isLoading }
}

export function useBiometricGate(promptMessage?: string) {
  const { authenticate, isAvailable } = useBiometricAuth({ promptMessage })

  const requireAuth = useCallback(async (action: () => void) => {
    if (!isAvailable) {
      action()
      return
    }

    const success = await authenticate()
    if (success) {
      action()
    } else {
      Alert.alert('Authentication Failed', 'Please authenticate to access this feature.')
    }
  }, [authenticate, isAvailable])

  return { requireAuth, isAvailable }
}
