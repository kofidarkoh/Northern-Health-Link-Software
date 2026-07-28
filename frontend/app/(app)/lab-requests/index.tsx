import React, { useState } from 'react'
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native'
import { Text, Chip, TextInput } from 'react-native-paper'
import { Screen, PageHeader } from '../../../src/components'
import { clinicalApi } from '../../../src/core/api'
import { useAuth } from '../../../src/features/auth'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import { SkeletonList } from '../../../src/components/ui/Skeleton'
import { router } from 'expo-router'
import type { LabRequest, LabRequestStatus } from '../../../src/types'

const STATUS_CONFIG: Record<LabRequestStatus, { color: string; icon: string }> = {
  REQUESTED: { color: '#FFC107', icon: 'time' },
  RESULT_UPLOADED: { color: '#4CAF50', icon: 'checkmark-circle' },
}

export default function LabRequestsScreen() {
  const { hasRole } = useAuth()
  const [statusFilter, setStatusFilter] = useState('')
  const canCreate = hasRole('CLINIC_STAFF', 'SPECIALIST', 'ADMIN')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['lab-requests', statusFilter],
    queryFn: () => clinicalApi.listLabRequests({ status: statusFilter || undefined }),
  })

  const requests = data?.lab_requests || []
  const requested = requests.filter(r => r.status === 'REQUESTED').length
  const completed = requests.filter(r => r.status === 'RESULT_UPLOADED').length

  if (isLoading) {
    return (
      <Screen>
        <PageHeader title="Lab Requests" showBack={false} />
        <View style={{ padding: Spacing.md }}>
          <SkeletonList count={5} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <PageHeader title="Lab Requests" subtitle="Clinical Laboratory Orders" showBack={false} />

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primary + '15' }]}>
              <Ionicons name="flask" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{requests.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFC107' + '15' }]}>
              <Ionicons name="time" size={20} color="#FFC107" />
            </View>
            <Text style={styles.statValue}>{requested}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#4CAF50' + '15' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.statValue}>{completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <Chip
            selected={statusFilter === ''}
            onPress={() => setStatusFilter('')}
            style={styles.chip}
            selectedColor={Colors.primary}
            showSelectedOverlay
          >
            All
          </Chip>
          {(Object.keys(STATUS_CONFIG) as LabRequestStatus[]).map(s => (
            <Chip
              key={s}
              selected={statusFilter === s}
              onPress={() => setStatusFilter(s)}
              style={styles.chip}
              selectedColor={STATUS_CONFIG[s].color}
              showSelectedOverlay
            >
              {s.replace('_', ' ')}
            </Chip>
          ))}
        </ScrollView>

        {requests.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="flask-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No lab requests found</Text>
          </View>
        ) : (
          requests.map(req => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.REQUESTED
            return (
              <View
                key={req.id}
                style={styles.card}
              >
                <View style={[styles.statusBar, { backgroundColor: cfg.color }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                      <Text style={styles.cardTitle}>{req.test_type}</Text>
                      <Text style={styles.cardSubtitle}>Patient #{req.patient_id}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.color + '15' }]}>
                      <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                      <Text style={[styles.statusText, { color: cfg.color }]}>
                        {req.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  {req.clinical_reason ? (
                    <Text style={styles.reason} numberOfLines={2}>{req.clinical_reason}</Text>
                  ) : null}
                  <Text style={styles.time}>
                    {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
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

  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },

  chipScroll: { marginBottom: Spacing.md },
  chip: { marginRight: Spacing.xs },

  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },

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
  cardSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  reason: { fontSize: 13, color: Colors.textSecondary, marginTop: 8, lineHeight: 18 },
  time: { fontSize: 11, color: Colors.textLight, marginTop: 6 },
})
