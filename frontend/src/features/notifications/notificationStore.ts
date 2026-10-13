import { create } from 'zustand'

export const useNotificationStore = create<{
  unreadCount: number
  setUnreadCount: (n: number) => void
}>((set) => ({
  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: n }),
}))
