import { apiClient } from '../../core/api/client'
import type { LoginRequest, LoginResponse, User } from '../../types'

export const loginApi = (d: LoginRequest) =>
  apiClient.post<LoginResponse>('/api/auth/login', d).then((res) => res.data)

export const getCurrentUserApi = () =>
  apiClient.get<{ user: User }>('/api/auth/me').then((res) => res.data.user)

export const logoutApi = (refreshToken?: string | null) =>
  apiClient.delete('/api/auth/logout', { data: { refresh_token: refreshToken } })

export const forgotPasswordApi = (email: string) =>
  apiClient.post<{ message: string }>('/api/auth/forgot-password', { email }).then((res) => res.data)

export const resetPasswordApi = (email: string, code: string, newPassword: string) =>
  apiClient.post<{ message: string }>('/api/auth/reset-password', { email, code, new_password: newPassword }).then((res) => res.data)
