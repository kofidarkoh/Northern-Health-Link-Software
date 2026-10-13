import { apiClient } from './client'
import type { Prescription, PaginatedMeta } from '../../types'

export const prescriptionsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient
      .get<PaginatedMeta & { prescriptions: Prescription[] }>('/api/prescriptions/', { params })
      .then((r) => r.data),

  get: (id: number) =>
    apiClient.get<{ prescription: Prescription }>(`/api/prescriptions/${id}`).then((r) => r.data.prescription),

  create: (data: Record<string, unknown>) =>
    apiClient.post<{ prescription: Prescription }>('/api/prescriptions/', data).then((r) => r.data),
}
