import React, { createContext, useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'
import type { User, UserRole } from '../../types'
import { setToken, setRefreshToken, setStoredUser, clearAuth, getToken, getRefreshToken } from './tokenStorage'
import { loginApi, getCurrentUserApi, logoutApi } from './authApi'
import { useSessionTimeout } from '../../hooks/useSessionTimeout'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { useBackgroundAuth } from '../../hooks/useBackgroundAuth'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (user_id: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasRole: (...roles: UserRole[]) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true, isAuthenticated: false })

  useEffect(() => {
    ;(async () => {
      try {
        const token = await getToken()
        if (!token) return setState({ user: null, isLoading: false, isAuthenticated: false })
        const user = await getCurrentUserApi()
        setState({ user, isLoading: false, isAuthenticated: true })
      } catch {
        await clearAuth()
        setState({ user: null, isLoading: false, isAuthenticated: false })
      }
    })()
  }, [])

  const login = useCallback(async (user_id: string, password: string) => {
    const res = await loginApi({ user_id, password })
    await Promise.all([setToken(res.access_token), setRefreshToken(res.refresh_token), setStoredUser(res.user)])
    setState({ user: res.user, isLoading: false, isAuthenticated: true })
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken()
    try {
      await logoutApi(refreshToken)
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      await clearAuth()
      setState({ user: null, isLoading: false, isAuthenticated: false })
    }
  }, [])

  const handleSessionTimeout = useCallback(() => {
    Alert.alert('Session Expired', 'You have been logged out due to inactivity.', [
      { text: 'OK', onPress: () => { logout(); router.replace('/(auth)/login') } }
    ])
  }, [logout])

  const handleBackgroundAuthRequired = useCallback(() => {
    Alert.alert('Re-authentication Required', 'Please log in again to continue.', [
      { text: 'OK', onPress: () => { logout(); router.replace('/(auth)/login') } }
    ])
  }, [logout])

  useSessionTimeout(handleSessionTimeout)
  usePushNotifications()
  useBackgroundAuth({
    enabled: state.isAuthenticated,
    promptMessage: 'Verify your identity to continue',
    onAuthRequired: handleBackgroundAuthRequired,
  })

  const hasRole = useCallback((...roles: UserRole[]) => !!state.user && roles.includes(state.user.role), [state.user])

  return <AuthContext.Provider value={{ ...state, login, logout, hasRole }}>{children}</AuthContext.Provider>
}
