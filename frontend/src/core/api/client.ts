import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { getToken, setToken, getRefreshToken, deleteToken, deleteRefreshToken, deleteStoredUser } from '../../features/auth/tokenStorage'
import { showToast } from '../../utils/toast'
import { Platform } from 'react-native'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'

const isProduction = process.env.EXPO_PUBLIC_APP_ENV === 'production'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

if (isProduction && Platform.OS !== 'web') {
  apiClient.interceptors.request.use((config) => {
    if (config.url && !config.url.startsWith('https://')) {
      console.warn('[Security] Blocking non-HTTPS request in production:', config.url)
      return Promise.reject(new Error('Production requests must use HTTPS'))
    }
    return config
  })
}

let isRefreshing = false
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : token && p.resolve(token)))
  failedQueue = []
}

export function forceLogout() {
  deleteToken()
  deleteRefreshToken()
  deleteStoredUser()
  if (typeof window !== 'undefined') {
    window.location.href = '/(auth)/login'
  }
}

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getToken()
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 429) {
      const data = error.response.data as any
      const message = data?.message || 'Too many requests. Please try again later.'
      showToast('Rate Limited', message)
      return Promise.reject(error)
    }

    if (error.response?.status !== 401 || original._retry) return Promise.reject(error)

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        if (original.headers) original.headers.Authorization = `Bearer ${token}`
        return apiClient(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const refreshToken = await getRefreshToken()
      if (!refreshToken) throw new Error('No refresh token')
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, null, {
        headers: { Authorization: `Bearer ${refreshToken}` },
      })
      await setToken(data.access_token)
      processQueue(null, data.access_token)
      if (original.headers) original.headers.Authorization = `Bearer ${data.access_token}`
      return apiClient(original)
    } catch (e) {
      processQueue(e, null)
      forceLogout()
      return Promise.reject(e)
    } finally {
      isRefreshing = false
    }
  },
)
