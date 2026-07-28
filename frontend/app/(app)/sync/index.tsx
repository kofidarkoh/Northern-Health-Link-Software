import React, { useCallback } from 'react'
import { View, ScrollView, StyleSheet, Alert } from 'react-native'
import { Text, Button, Chip, Divider, IconButton } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import { Screen, PageHeader } from '../../../src/components'
import { useOfflineStore } from '../../../src/features/offline/offlineStore'

const ENTITY_LABELS: Record<string, string> = {
  patient: 'Patient',
  appointment: 'Appointment',
  'lab-request': 'Lab Request',
  prescription: 'Prescription',
  delivery: 'Delivery',
}

const METHOD_COLORS: Record<string, string> = {
  POST: Colors.success,
  PUT: Colors.secondary,
  PATCH: Colors.secondaryDark,
  DELETE: Colors.error,
}

export default function SyncScreen() {
  const { queue, isSyncing, isOfflineMode, lastSyncAt, toggleOfflineMode, syncQueue, removeItem, clearQueue } =
    useOfflineStore()

  const handleSync = useCallback(async () => {
    const result = await syncQueue()
    Alert.alert('Sync Complete', `Synced: ${result.synced}\nFailed: ${result.failed}`)
  }, [syncQueue])

  const handleClear = useCallback(() => {
    Alert.alert('Clear Queue', `Remove all ${queue.length} queued items?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearQueue },
    ])
  }, [queue.length, clearQueue])

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Screen>
      <PageHeader title="Sync Manager" subtitle="Offline queue & data synchronisation" />

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Ionicons
            name={isOfflineMode ? 'cloud-offline' : 'cloud-done'}
            size={28}
            color={isOfflineMode ? Colors.warning : Colors.success}
          />
          <View style={styles.statusInfo}>
            <Text variant="titleMedium" style={styles.statusTitle}>
              {isOfflineMode ? 'Offline Mode' : 'Online'}
            </Text>
            <Text variant="bodySmall" style={styles.statusSub}>
              {queue.length === 0 ? 'All data synced' : `${queue.length} item${queue.length === 1 ? '' : 's'} pending`}
              {lastSyncAt ? ` \u2022 Last sync: ${formatTime(lastSyncAt)}` : ''}
            </Text>
          </View>
          <Button
            mode={isOfflineMode ? 'contained' : 'outlined'}
            buttonColor={isOfflineMode ? Colors.warning : undefined}
            onPress={toggleOfflineMode}
            style={styles.offlineBtn}
          >
            {isOfflineMode ? 'Go Online' : 'Go Offline'}
          </Button>
        </View>
      </View>

      {queue.length > 0 && (
        <View style={styles.actions}>
          <Button
            mode="contained"
            buttonColor={Colors.primary}
            loading={isSyncing}
            disabled={isSyncing || isOfflineMode}
            onPress={handleSync}
            icon="sync"
            style={styles.syncBtn}
          >
            Sync Now
          </Button>
          <Button mode="outlined" textColor={Colors.error} onPress={handleClear} style={styles.clearBtn}>
            Clear Queue
          </Button>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.listContainer}>
        {queue.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Queue Empty
            </Text>
            <Text variant="bodySmall" style={styles.emptySub}>
              All actions have been synced to the server.
            </Text>
          </View>
        ) : (
          queue.map((item) => (
            <View key={item.id} style={styles.queueCard}>
              <View style={styles.queueHeader}>
                <Chip
                  compact
                  style={[styles.methodChip, { backgroundColor: (METHOD_COLORS[item.method] || Colors.textSecondary) + '20' }]}
                  textStyle={{ color: METHOD_COLORS[item.method] || Colors.textSecondary, fontWeight: '700', fontSize: 11 }}
                >
                  {item.method}
                </Chip>
                <Text variant="labelMedium" style={styles.entityLabel}>
                  {ENTITY_LABELS[item.entityType] || item.entityType}
                </Text>
                <IconButton icon="close" size={16} onPress={() => removeItem(item.id)} style={styles.removeBtn} />
              </View>
              <Text variant="bodySmall" style={styles.endpoint}>
                {item.endpoint}
              </Text>
              {item.lastError ? (
                <Text variant="bodySmall" style={styles.errorText}>
                  Error: {item.lastError} (retry {item.retries}/3)
                </Text>
              ) : null}
              <Text variant="bodySmall" style={styles.time}>
                Queued at {formatTime(item.createdAt)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  statusInfo: { flex: 1 },
  statusTitle: { fontWeight: '700', color: Colors.text },
  statusSub: { color: Colors.textSecondary, marginTop: 2 },
  offlineBtn: { borderRadius: 10 },

  actions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  syncBtn: { flex: 1, borderRadius: 10 },
  clearBtn: { borderRadius: 10, borderColor: Colors.error },

  listContainer: { paddingBottom: Spacing.xxl },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyTitle: { fontWeight: '700', color: Colors.text, marginTop: Spacing.md },
  emptySub: { color: Colors.textSecondary, marginTop: Spacing.xs },

  queueCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  queueHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  methodChip: { height: 26 },
  entityLabel: { flex: 1, fontWeight: '700', color: Colors.text, fontSize: 14 },
  removeBtn: { margin: -8 },
  endpoint: { color: Colors.textSecondary, fontFamily: 'monospace', fontSize: 12, marginTop: Spacing.xs },
  errorText: { color: Colors.error, fontSize: 12, marginTop: Spacing.xs, fontWeight: '500' },
  time: { color: Colors.textLight, fontSize: 11, marginTop: Spacing.xs },
})
