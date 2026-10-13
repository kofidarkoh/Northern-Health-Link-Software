import { apiClient } from './client'
import type { Patient, PaginatedMeta } from '../../types'

export interface PatientListParams {
  search?: string
  gender?: string
  district?: string
  page?: number
  per_page?: number
}

export type PatientListResponse = PaginatedMeta & { patients: Patient[] }

export const patientsApi = {
  list: (params?: PatientListParams) =>
    apiClient.get<PatientListResponse>('/api/patients/', { params }).then((r) => r.data),

  get: (id: number) =>
    apiClient.get<{ patient: Patient }>(`/api/patients/${id}`).then((r) => r.data.patient),

  create: (data: Record<string, unknown>) =>
    apiClient.post<{ patient: Patient; duplicate_warning?: string }>('/api/patients/', data).then((r) => r.data),

  update: (id: number, data: Record<string, unknown>) =>
    apiClient.put<{ patient: Patient; duplicate_warning?: string }>(`/api/patients/${id}`, data).then((r) => r.data),

  remove: (id: number) => apiClient.delete(`/api/patients/${id}`),
}
