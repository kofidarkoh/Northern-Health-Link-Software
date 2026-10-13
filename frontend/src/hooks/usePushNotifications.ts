import { useContext, useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { router } from 'expo-router'
import { AuthContext } from '../features/auth/AuthProvider'
import { apiClient } from '../core/api/client'
import type * as NotificationsType from 'expo-notifications'

// expo-notifications remote push was removed from Expo Go in SDK 53.
// Require lazily so the import itself can never crash the app there;
// everything below no-ops when the module is unavailable.
let Notifications: typeof NotificationsType | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications') as typeof NotificationsType
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
} catch {
  Notifications = null
}

function handleNotificationNavigation(data: Record<string, any>) {
  const type = data.notification_type || data.type
  const id = data.entity_id || data.id

  if (!type) return

  switch (type) {
    case 'appointment':
    case 'appointment_reminder':
      if (id) router.push(`/(app)/appointments/${id}`)
      else router.push('/(app)/appointments')
      break
    case 'lab_result':
    case 'lab_request':
      router.push('/(app)/lab-results')
      break
    case 'prescription':
      router.push('/(app)/prescriptions')
      break
    case 'delivery':
    case 'delivery_update':
      router.push('/(app)/deliveries')
      break
    case 'consultation':
      router.push('/(app)/consultations')
      break
    default:
      router.push('/(app)/')
      break
  }
}

export function usePushNotifications() {
  const ctx = useContext(AuthContext)
  const user = ctx?.user
  const responseListener = useRef<{ remove: () => void } | null>(null)

  useEffect(() => {
    if (!user || !Notifications) return

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        apiClient.post('/api/notifications/register-device', { token, platform: Platform.OS }).catch(() => {})
      }
    })

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data
      handleNotificationNavigation(data as Record<string, any>)
    })

    return () => {
      if (responseListener.current) {
        responseListener.current.remove()
      }
    }
  }, [user])
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (!Notifications) return undefined

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
