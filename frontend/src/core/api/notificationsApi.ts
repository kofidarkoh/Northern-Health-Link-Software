import { apiClient } from './client'
import type { Notification, PaginatedMeta } from '../../types'

export const notificationsApi = {
  list: (params?: { page?: number; per_page?: number; unread_only?: boolean }) =>
    apiClient
      .get<PaginatedMeta & { notifications: Notification[] }>('/api/notifications/', { params })
      .then((r) => r.data),

  markRead: (id: number) => apiClient.patch(`/api/notifications/${id}/read`),

  markAllRead: () => apiClient.patch('/api/notifications/read-all'),
}
