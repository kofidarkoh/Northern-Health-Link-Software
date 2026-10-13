import { io, Socket } from 'socket.io-client'
import { getToken } from '../../features/auth/tokenStorage'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'

let socket: Socket | null = null

export async function connectNotificationSocket(): Promise<Socket> {
  if (socket?.connected) return socket

  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  socket = io(API_BASE_URL, {
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
  })

  return socket
}

export function disconnectNotificationSocket() {
  socket?.disconnect()
  socket = null
}

export function getSocket() {
  return socket
}
