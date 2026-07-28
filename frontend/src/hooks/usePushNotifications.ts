import { useContext, useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { AuthContext } from '../features/auth/AuthProvider'
import { apiClient } from '../core/api/client'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export function usePushNotifications() {
  const ctx = useContext(AuthContext)
  const user = ctx?.user

  useEffect(() => {
    if (!user) return

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        apiClient.post('/api/notifications/register-device', { token, platform: Platform.OS }).catch(() => {})
      }
    })

    const sub = Notifications.addNotificationReceivedListener(() => {})

    return () => {
      sub.remove()
    }
  }, [user])
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return undefined

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId: 'nhls-app' })
    return token.data
  } catch {
    return undefined
  }
}
