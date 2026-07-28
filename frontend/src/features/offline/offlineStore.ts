import { create } from 'zustand'
import { Platform } from 'react-native'

export type QueueEntityType = 'patient' | 'appointment' | 'lab-request' | 'prescription' | 'delivery'

export interface QueueItem {
  id: string
  entityType: QueueEntityType
  endpoint: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  payload: Record<string, unknown>
  createdAt: number
  retries: number
  lastError?: string
}

interface OfflineState {
  isOfflineMode: boolean
  isSyncing: boolean
  queue: QueueItem[]
  lastSyncAt: number | null
  toggleOfflineMode: () => void
  enqueue: (item: Omit<QueueItem, 'id' | 'createdAt' | 'retries'>) => void
  removeItem: (id: string) => void
  clearQueue: () => void
  syncQueue: () => Promise<{ synced: number; failed: number }>
  loadPersisted: () => Promise<void>
}

const STORAGE_KEY = 'nhl_offline_queue'
const SYNC_KEY = 'nhl_last_sync'
const OFFLINE_KEY = 'nhl_offline_mode'

async function readStorage<T>(key: string): Promise<T | null> {
  try {
    if (Platform.OS === 'web') {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    }
    const SecureStore = await import('expo-secure-store')
    const raw = await SecureStore.getItemAsync(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

async function writeStorage<T>(key: string, value: T): Promise<void> {
  try {
    const json = JSON.stringify(value)
    if (Platform.OS === 'web') {
      localStorage.setItem(key, json)
      return
    }
    const SecureStore = await import('expo-secure-store')
    await SecureStore.setItemAsync(key, json)
  } catch {}
}

async function deleteStorage(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key)
      return
    }
    const SecureStore = await import('expo-secure-store')
    await SecureStore.deleteItemAsync(key)
  } catch {}
}

function generateId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

let apiClientRef: { post: Function; put: Function; patch: Function; delete: Function } | null = null

export function setApiClient(client: typeof apiClientRef) {
  apiClientRef = client
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOfflineMode: false,
  isSyncing: false,
  queue: [],
  lastSyncAt: null,

  toggleOfflineMode: () => {
    const next = !get().isOfflineMode
    set({ isOfflineMode: next })
    writeStorage(OFFLINE_KEY, next)
  },

  enqueue: (item) => {
    const queueItem: QueueItem = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
      retries: 0,
    }
    const queue = [...get().queue, queueItem]
    set({ queue })
    writeStorage(STORAGE_KEY, queue)
  },

  removeItem: (id) => {
    const queue = get().queue.filter((q) => q.id !== id)
    set({ queue })
    writeStorage(STORAGE_KEY, queue)
  },

  clearQueue: () => {
    set({ queue: [] })
    deleteStorage(STORAGE_KEY)
  },

  syncQueue: async () => {
    const { queue } = get()
    if (!queue.length || !apiClientRef) return { synced: 0, failed: queue.length }

    set({ isSyncing: true })
    let synced = 0
    let failed = 0
    const remaining: QueueItem[] = []

    for (const item of queue) {
      try {
        const method = item.method.toLowerCase()
        await (apiClientRef as any)[method](item.endpoint, item.payload)
        synced++
      } catch (err: any) {
        const updated = {
          ...item,
          retries: item.retries + 1,
          lastError: err?.message || 'Sync failed',
        }
        if (updated.retries < 3) {
          remaining.push(updated)
        } else {
          failed++
        }
      }
    }

    set({
      queue: remaining,
      isSyncing: false,
      lastSyncAt: Date.now(),
    })
    writeStorage(STORAGE_KEY, remaining)
    writeStorage(SYNC_KEY, Date.now())
    return { synced, failed }
  },

  loadPersisted: async () => {
    const [queue, lastSyncAt, isOfflineMode] = await Promise.all([
      readStorage<QueueItem[]>(STORAGE_KEY),
      readStorage<number>(SYNC_KEY),
      readStorage<boolean>(OFFLINE_KEY),
    ])
    set({
      queue: queue || [],
      lastSyncAt: lastSyncAt || null,
      isOfflineMode: isOfflineMode || false,
    })
  },
}))
