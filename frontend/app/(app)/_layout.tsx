import { Stack, Redirect } from 'expo-router'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { useEffect } from 'react'
import { useAuth } from '../../src/features/auth'
import { useNotificationSocket } from '../../src/features/notifications/useNotificationSocket'
import { useOfflineStore, setApiClient } from '../../src/features/offline/offlineStore'
import { apiClient } from '../../src/core/api/client'
import { Colors } from '../../src/constants'

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  useNotificationSocket()

  useEffect(() => {
    setApiClient(apiClient)
    useOfflineStore.getState().loadPersisted()
  }, [])

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="patients" />
      <Stack.Screen name="appointments" />
      <Stack.Screen name="lab-requests" />
      <Stack.Screen name="lab-results" />
      <Stack.Screen name="prescriptions" />
      <Stack.Screen name="deliveries" />
      <Stack.Screen name="consultations" />
      <Stack.Screen name="users" />
      <Stack.Screen name="clinics" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="audit-logs" />
      <Stack.Screen name="sync" options={{ headerShown: false }} />
      <Stack.Screen name="profile" />
    </Stack>
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
})
