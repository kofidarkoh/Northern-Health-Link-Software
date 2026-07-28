import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Text } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../constants'
import { useOfflineStore } from '../../features/offline/offlineStore'
import { router } from 'expo-router'

export function OfflineBanner() {
  const { isOfflineMode, queue, isSyncing } = useOfflineStore()

  if (!isOfflineMode && queue.length === 0) return null

  const pendingCount = queue.length

  return (
    <Pressable style={styles.banner} onPress={() => router.push('/(app)/sync')}>
      <View style={styles.row}>
        <Ionicons
          name={isOfflineMode ? 'cloud-offline-outline' : 'sync-outline'}
          size={16}
          color={Colors.white}
        />
        <Text style={styles.text}>
          {isOfflineMode
            ? `Offline Mode${pendingCount > 0 ? ` \u2022 ${pendingCount} pending` : ''}`
            : `${pendingCount} items to sync`}
        </Text>
        {isSyncing ? (
          <Ionicons name="sync" size={14} color={Colors.secondary} style={styles.spinner} />
        ) : (
          <Ionicons name="chevron-forward" size={14} color={Colors.white} />
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  text: {
    flex: 1,
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
  },
  spinner: {},
})
