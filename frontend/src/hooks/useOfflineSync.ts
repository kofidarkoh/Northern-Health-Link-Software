import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { useOfflineStore } from '../features/offline/offlineStore'

export function useOfflineSync() {
  const { isOfflineMode, queue, syncQueue } = useOfflineStore()
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false
      if (!connected) return
      if (queue.length > 0 && !isOfflineMode) {
        syncQueue()
      }
    })

    return () => unsubscribe()
  }, [queue.length, isOfflineMode])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        NetInfo.fetch().then(state => {
          const connected = state.isConnected ?? false
          if (connected && queue.length > 0 && !isOfflineMode) {
            syncQueue()
          }
        })
      }
      appState.current = nextState
    })

    return () => sub.remove()
  }, [queue.length, isOfflineMode])
}
