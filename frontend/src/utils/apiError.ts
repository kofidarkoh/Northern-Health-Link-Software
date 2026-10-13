import { AxiosError } from 'axios'

export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: string; message?: string; details?: Record<string, string[]> } | undefined
    if (data?.error) return data.error
    if (data?.message) return data.message
    if (data?.details) {
      const first = Object.values(data.details)[0]
      if (Array.isArray(first) && first[0]) return first[0]
    }
    if (err.message === 'Network Error') return 'Network error. Check your connection and API URL.'
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}
