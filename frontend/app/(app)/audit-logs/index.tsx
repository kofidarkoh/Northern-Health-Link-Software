import React, { useState } from 'react'
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native'
import { Text, Chip, TextInput } from 'react-native-paper'
import { Screen, PageHeader } from '../../../src/components'
import { adminApi } from '../../../src/core/api/adminApi'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import type { AuditLog } from '../../../src/types'

const ACTION_CONFIG: Record<string, { color: string; icon: string }> = {
  LOGIN: { color: '#FFC107', icon: 'log-in' },
  LOGOUT: { color: '#6F42C1', icon: 'log-out' },
  USER_CREATED: { color: '#4CAF50', icon: 'person-add' },
  USER_UPDATED: { color: '#17A2B8', icon: 'create' },
  USER_DELETED: { color: '#DC3545', icon: 'trash' },
  PASSWORD_CHANGED: { color: '#FF8C00', icon: 'key' },
  PASSWORD_RESET: { color: '#DC3545', icon: 'key' },
  PROFILE_UPDATED: { color: '#17A2B8', icon: 'person' },
  CLINIC_CREATED: { color: '#4CAF50', icon: 'business' },
}

function getActionConfig(action: string) {
  for (const [key, cfg] of Object.entries(ACTION_CONFIG)) {
    if (action.includes(key)) return cfg
  }
  if (action.includes('CREATE') || action.includes('REGISTER')) return { color: '#4CAF50', icon: 'add-circle' }
  if (action.includes('UPDATE') || action.includes('EDIT')) return { color: '#17A2B8', icon: 'create' }
  if (action.includes('DELETE') || action.includes('REMOVE')) return { color: '#DC3545', icon: 'trash' }
  return { color: Colors.textSecondary, icon: 'ellipsis-horizontal' }
}

export default function AuditLogsScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [entityFilter, setEntityFilter] = useState<string>('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-audit-logs', entityFilter],
    queryFn: () => adminApi.listAuditLogs(entityFilter ? { entity_type: entityFilter } : undefined),
  })

  const logs = data?.audit_logs || []
  const filtered = logs.filter(log =>
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const uniqueEntities = [...new Set(logs.map(l => l.entity_type))]

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHrs = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHrs < 24) return `${diffHrs}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatFullTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const groupedLogs = filtered.reduce((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {} as Record<string, AuditLog[]>)

  return (
    <Screen>
      <PageHeader title="Audit Logs" subtitle="Security & Activity Trail" showBack={false} />

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={Colors.textLight} />
          <TextInput
            placeholder="Search logs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            mode="flat"
            style={styles.searchInput}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            contentStyle={{ minHeight: 0, paddingVertical: 0 }}
            theme={{ roundness: 8 }}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <Chip
            selected={entityFilter === ''}
            onPress={() => setEntityFilter('')}
            style={styles.chip}
            selectedColor={Colors.primary}
            showSelectedOverlay
          >
            All
          </Chip>
          {uniqueEntities.map(entity => (
            <Chip
              key={entity}
              selected={entityFilter === entity}
              onPress={() => setEntityFilter(entity)}
              style={styles.chip}
              selectedColor={Colors.primary}
              showSelectedOverlay
            >
              {entity}
            </Chip>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No audit logs found</Text>
          </View>
        ) : (
          Object.entries(groupedLogs).map(([date, dayLogs]) => (
            <View key={date} style={styles.dayGroup}>
              <View style={styles.dayHeader}>
                <View style={styles.dayLine} />
                <Text style={styles.dayLabel}>{date}</Text>
                <View style={styles.dayLine} />
              </View>

              {dayLogs.map((log, idx) => {
                const cfg = getActionConfig(log.action)
                return (
                  <View key={log.id} style={styles.timelineRow}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineDot, { backgroundColor: cfg.color }]} />
                      {idx < dayLogs.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineCard}>
                      <View style={styles.timelineHeader}>
                        <View style={[styles.actionBadge, { backgroundColor: cfg.color + '15' }]}>
                          <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
                          <Text style={[styles.actionText, { color: cfg.color }]}>{log.action.replace(/_/g, ' ')}</Text>
                        </View>
                        <Text style={styles.timeText}>{formatTime(log.created_at)}</Text>
                      </View>
                      <View style={styles.timelineBody}>
                        <Text style={styles.entityText}>{log.entity_type}</Text>
                        {log.entity_id ? <Text style={styles.idText}>ID: {log.entity_id}</Text> : null}
                      </View>
                      <Text style={styles.fullTime}>{formatFullTime(log.created_at)}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInput: { flex: 1, backgroundColor: 'transparent', fontSize: 14 },

  chipScroll: { marginBottom: Spacing.md },
  chip: { marginRight: Spacing.xs },

  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },

  dayGroup: { marginBottom: Spacing.md },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  dayLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dayLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },

  timelineRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  timelineLeft: { width: 24, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  timelineLine: { flex: 1, width: 2, backgroundColor: Colors.border, marginTop: 4 },

  timelineCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginLeft: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  actionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  actionText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  timeText: { fontSize: 11, color: Colors.textLight, fontWeight: '500' },
  timelineBody: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  entityText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  idText: { fontSize: 12, color: Colors.textSecondary },
  fullTime: { fontSize: 10, color: Colors.textLight, marginTop: 4 },
})
