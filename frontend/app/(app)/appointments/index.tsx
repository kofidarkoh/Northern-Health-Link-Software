import { useState, useCallback } from 'react'
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native'
import { Text, Chip, Button } from 'react-native-paper'
import { Screen, PageHeader } from '../../../src/components'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import { SkeletonList } from '../../../src/components/ui/Skeleton'
import { router } from 'expo-router'
import { formatDate } from '../../../src/utils/format'
import { clinicalApi } from '../../../src/core/api/clinicalApi'
import type { AppointmentStatus } from '../../../src/types'

const STATUS_CONFIG: Record<AppointmentStatus, { color: string; icon: string }> = {
  REQUESTED: { color: '#FFC107', icon: 'time' },
  SCHEDULED: { color: '#17A2B8', icon: 'calendar' },
  IN_PROGRESS: { color: '#FF8C00', icon: 'videocam' },
  COMPLETED: { color: '#4CAF50', icon: 'checkmark-circle' },
  CANCELLED: { color: '#DC3545', icon: 'close-circle' },
}

const STATUSES: AppointmentStatus[] = ['REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

export default function AppointmentsScreen() {
  const [statusFilter, setStatusFilter] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['appointments', statusFilter],
    queryFn: () => clinicalApi.listAppointments({ status: statusFilter || undefined, per_page: 50 }),
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const appointments = data?.appointments || []

  const statusCounts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = appointments.filter(a => a.status === s).length
    return acc
  }, {})

  if (isLoading) {
    return (
      <Screen>
        <PageHeader title="Appointments" showBack={false} />
        <View style={{ padding: Spacing.md }}>
          <SkeletonList count={5} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <PageHeader title="Appointments" subtitle={`${data?.total ?? 0} Records`} showBack={false} />

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          {STATUSES.slice(0, 4).map(s => {
            const cfg = STATUS_CONFIG[s]
            return (
              <View key={s} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: cfg.color + '15' }]}>
                  <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
                </View>
                <Text style={styles.statValue}>{statusCounts[s]}</Text>
                <Text style={styles.statLabel}>{s.replace('_', ' ')}</Text>
              </View>
            )
          })}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <Chip
            selected={statusFilter === ''}
            onPress={() => setStatusFilter('')}
            style={styles.chip}
            selectedColor={Colors.primary}
            showSelectedOverlay
          >
            All ({appointments.length})
          </Chip>
          {STATUSES.map(s => (
            <Chip
              key={s}
              selected={statusFilter === s}
              onPress={() => setStatusFilter(s)}
              style={styles.chip}
              selectedColor={STATUS_CONFIG[s].color}
              showSelectedOverlay
            >
              {s.replace('_', ' ')} ({statusCounts[s]})
            </Chip>
          ))}
        </ScrollView>

        {appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No appointments yet</Text>
            <Text style={styles.emptySubtitle}>Book your first appointment to get started</Text>
            <Button mode="contained" onPress={() => router.push('/(app)/appointments/new')} style={{ marginTop: 16, backgroundColor: Colors.primary }}>
              Book Appointment
            </Button>
          </View>
        ) : (
          appointments.map(appt => {
            const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.REQUESTED
            return (
              <View
                key={appt.id}
                style={styles.card}
              >
                <View style={[styles.statusBar, { backgroundColor: cfg.color }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                      <Text style={styles.cardTitle}>Appointment #{appt.id}</Text>
                      <Text style={styles.cardTime}>
                        <Ionicons name="time" size={12} color={Colors.textSecondary} />{' '}
                        {formatDate(appt.appointment_time)}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.color + '15' }]}>
                      <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                      <Text style={[styles.statusText, { color: cfg.color }]}>
                        {appt.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardMeta}>
                    <View style={[styles.metaBadge, { backgroundColor: '#DC3545' + '12' }]}>
                      <Ionicons name="person" size={10} color="#DC3545" />
                      <Text style={[styles.metaText, { color: '#DC3545' }]}>Patient #{appt.patient_id}</Text>
                    </View>
                    <View style={[styles.metaBadge, { backgroundColor: '#2D3E18' + '12' }]}>
                      <Ionicons name="medical" size={10} color="#2D3E18" />
                      <Text style={[styles.metaText, { color: '#2D3E18' }]}>Specialist #{appt.specialist_id}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  statsRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 9, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  chipScroll: { marginBottom: Spacing.md },
  chip: { marginRight: Spacing.xs },

  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  statusBar: { width: 4 },
  cardBody: { flex: 1, padding: Spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  cardMeta: { flexDirection: 'row', gap: Spacing.xs, marginTop: 8, flexWrap: 'wrap' },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  metaText: { fontSize: 11, fontWeight: '600' },
})
