import { apiClient } from '../../core/api/client'
import type { LoginRequest, LoginResponse, User } from '../../types'

export const loginApi = (d: LoginRequest) =>
  apiClient.post<LoginResponse>('/api/auth/login', d).then((res) => res.data)

export const getCurrentUserApi = () =>
  apiClient.get<{ user: User }>('/api/auth/me').then((res) => res.data.user)

export const logoutApi = (refreshToken?: string | null) =>
  apiClient.delete('/api/auth/logout', { data: { refresh_token: refreshToken } })

export const forgotPasswordApi = (userId: string) =>
  apiClient
    .post<{ message: string; security_question: string; user_id: string }>('/api/auth/forgot-password', { user_id: userId })
    .then((res) => res.data)

export const verifySecurityAnswerApi = (userId: string, answer: string) =>
  apiClient
    .post<{ message: string; reset_code: string }>('/api/auth/verify-security-answer', { user_id: userId, answer })
    .then((res) => res.data)

export const resetPasswordApi = (userId: string, code: string, newPassword: string) =>
  apiClient
    .post<{ message: string }>('/api/auth/reset-password', { user_id: userId, code, new_password: newPassword })
    .then((res) => res.data)
