import { apiClient } from './client'
import type { User, Clinic, AuditLog, DashboardStats, PaginatedMeta } from '../../types'

export const adminApi = {
  listUsers: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedMeta & { users: User[] }>('/api/admin/users', { params }).then((r) => r.data),

  createUser: (data: Record<string, unknown>) =>
    apiClient.post<{ user: User }>('/api/admin/users', data).then((r) => r.data),

  updateUser: (userId: number, data: Record<string, unknown>) =>
    apiClient.patch<{ user: User }>(`/api/admin/users/${userId}`, data).then((r) => r.data),

  deleteUser: (userId: number) =>
    apiClient.delete(`/api/admin/users/${userId}`).then((r) => r.data),

  listClinics: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedMeta & { clinics: Clinic[] }>('/api/admin/clinics', { params }).then((r) => r.data),

  createClinic: (data: Record<string, unknown>) =>
    apiClient.post<{ clinic: Clinic }>('/api/admin/clinics', data).then((r) => r.data),

  getDashboard: () =>
    apiClient.get<{ stats: DashboardStats }>('/api/admin/dashboard').then((r) => r.data.stats),

  listAuditLogs: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedMeta & { audit_logs: AuditLog[] }>('/api/admin/audit-logs', { params }).then((r) => r.data),
}
