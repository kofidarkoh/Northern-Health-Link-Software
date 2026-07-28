import { apiClient } from './client'
import type { User } from '../../types'

export const profileApi = {
  getProfile: () =>
    apiClient.get<{ user: User }>('/api/auth/me').then((r) => r.data.user),

  updateProfile: (data: { full_name?: string; phone?: string }) =>
    apiClient.patch<{ user: User; message: string }>('/api/auth/me', data).then((r) => r.data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    apiClient.put<{ message: string }>('/api/auth/me/password', data).then((r) => r.data),
}
