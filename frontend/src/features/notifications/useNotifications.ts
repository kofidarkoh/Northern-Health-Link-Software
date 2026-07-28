import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../../core/api'
import { useNotificationStore } from './notificationStore'
import { useEffect } from 'react'

export function useNotifications() {
  const setUnread = useNotificationStore((s) => s.setUnreadCount)
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ per_page: 50 }),
    refetchInterval: 60000,
  })

  useEffect(() => {
    if (query.data) {
      const unread = query.data.notifications.filter((n) => !n.read_at).length
      setUnread(unread)
    }
  }, [query.data, setUnread])

  return query
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  const setUnread = useNotificationStore((s) => s.setUnreadCount)
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      setUnread(0)
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  const setUnread = useNotificationStore((s) => s.setUnreadCount)
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      setUnread(0)
    },
  })
}
