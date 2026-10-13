import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { connectNotificationSocket, getSocket } from '../../core/socket/notifications'
import { useAuth } from '../auth/useAuth'

export function useNotificationSocket() {
  const { isAuthenticated } = useAuth()
  const qc = useQueryClient()

  useEffect(() => {
    if (!isAuthenticated) return

    let active = true

    connectNotificationSocket()
      .then((socket) => {
        if (!active) return
        const refresh = () => qc.invalidateQueries({ queryKey: ['notifications'] })
        socket.on('connection_established', refresh)
        socket.on('notification', refresh)
      })
      .catch(() => {})

    return () => {
      active = false
      getSocket()?.off('notification')
      getSocket()?.off('connection_established')
    }
  }, [isAuthenticated, qc])
}
