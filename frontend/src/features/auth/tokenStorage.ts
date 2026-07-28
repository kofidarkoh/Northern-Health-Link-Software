import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const KEYS = { ACCESS: 'access_token', REFRESH: 'refresh_token', USER: 'user_data' } as const

const isWeb = Platform.OS === 'web'

const getItem = async (key: string): Promise<string | null> => {
  if (isWeb) {
    return localStorage.getItem(key)
  }
  return SecureStore.getItemAsync(key)
}

const setItem = async (key: string, value: string): Promise<void> => {
  if (isWeb) {
    localStorage.setItem(key, value)
    return
  }
  return SecureStore.setItemAsync(key, value)
}

const deleteItem = async (key: string): Promise<void> => {
  if (isWeb) {
    localStorage.removeItem(key)
    return
  }
  return SecureStore.deleteItemAsync(key)
}

export const getToken = () => getItem(KEYS.ACCESS)
export const setToken = (t: string) => setItem(KEYS.ACCESS, t)
export const deleteToken = () => deleteItem(KEYS.ACCESS)

export const getRefreshToken = () => getItem(KEYS.REFRESH)
export const setRefreshToken = (t: string) => setItem(KEYS.REFRESH, t)
export const deleteRefreshToken = () => deleteItem(KEYS.REFRESH)

export const getStoredUser = async <T>(): Promise<T | null> => {
  const r = await getItem(KEYS.USER)
  return r ? (JSON.parse(r) as T) : null
}
export const setStoredUser = <T>(u: T) => setItem(KEYS.USER, JSON.stringify(u))
export const deleteStoredUser = () => deleteItem(KEYS.USER)

export const clearAuth = () =>
  Promise.all([
    deleteToken(),
    deleteRefreshToken(),
    deleteStoredUser(),
  ])
