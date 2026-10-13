import { apiClient } from './client'
import type { Delivery, PaginatedMeta } from '../../types'

export const deliveriesApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedMeta & { deliveries: Delivery[] }>('/api/deliveries/', { params }).then((r) => r.data),

  get: (id: number) =>
    apiClient.get<{ delivery: Delivery }>(`/api/deliveries/${id}`).then((r) => r.data.delivery),

  create: (data: Record<string, unknown>) =>
    apiClient.post<{ delivery: Delivery }>('/api/deliveries/', data).then((r) => r.data),

  updateStatus: (id: number, data: { status: string; status_note?: string }) =>
    apiClient.patch<{ delivery: Delivery }>(`/api/deliveries/${id}/status`, data).then((r) => r.data),
}
