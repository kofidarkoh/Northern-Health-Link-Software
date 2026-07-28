import React from 'react'
import { StyleSheet, View, ScrollView, RefreshControl, Platform, Pressable } from 'react-native'
import { Screen, PageHeader } from '../../../src/components'
import { adminApi } from '../../../src/core/api/adminApi'
import { useQuery } from '@tanstack/react-query'
import { Text } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Colors, Spacing } from '../../../src/constants'

const STAT_CONFIG = [
  { key: 'total_users', label: 'Users', icon: 'people', color: '#2D3E18' },
  { key: 'total_clinics', label: 'Clinics', icon: 'business', color: '#17A2B8' },
  { key: 'total_patients', label: 'Patients', icon: 'heart', color: '#DC3545' },
  { key: 'total_appointments', label: 'Appointments', icon: 'calendar', color: '#FF8C00' },
  { key: 'pending_lab_requests', label: 'Pending Labs', icon: 'flask', color: '#FFC107' },
  { key: 'pending_deliveries', label: 'Deliveries', icon: 'bicycle', color: '#6F42C1' },
] as const

const QUICK_ACTIONS = [
  { key: 'users', label: 'Users', icon: 'people', color: '#2D3E18', href: '/(app)/users', desc: 'Manage accounts & roles' },
  { key: 'clinics', label: 'Clinics', icon: 'business', color: '#17A2B8', href: '/(app)/clinics', desc: 'Medical centers' },
  { key: 'patients', label: 'Patients', icon: 'heart', color: '#DC3545', href: '/(app)/patients', desc: 'Patient records' },
  { key: 'appointments', label: 'Appointments', icon: 'calendar', color: '#FF8C00', href: '/(app)/appointments', desc: 'Schedule & manage' },
  { key: 'lab-requests', label: 'Lab Requests', icon: 'flask', color: '#FFC107', href: '/(app)/lab-requests', desc: 'Test requests' },
  { key: 'audit-logs', label: 'Audit Logs', icon: 'document-text', color: '#6F42C1', href: '/(app)/audit-logs', desc: 'Activity tracking' },
]

const STATUS_ITEMS = [
  { label: 'Backend API', icon: 'server', key: 'api' },
  { label: 'Database', icon: 'cloud-done', key: 'db' },
  { label: 'WebSocket', icon: 'wifi', key: 'ws' },
]

export default function DashboardScreen() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard(),
    refetchInterval: 60000,
  })

  return (
    <Screen>
      <PageHeader title="Dashboard" subtitle="System Overview" showBack={false} />

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          {STAT_CONFIG.map((stat) => {
            const value = data ? (data as unknown as Record<string, number>)[stat.key] : 0
            return (
              <View key={stat.key} style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: stat.color + '12' }]}>
                  <Ionicons name={stat.icon as any} size={22} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                {(stat.key === 'pending_lab_requests' || stat.key === 'pending_deliveries') && value > 0 ? (
                  <View style={[styles.pendingBadge, { backgroundColor: stat.color + '15' }]}>
                    <Text style={[styles.pendingText, { color: stat.color }]}>Needs attention</Text>
                  </View>
                ) : null}
              </View>
            )
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionSubtitle}>Navigate to system modules</Text>
        </View>

        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.key}
              style={({ pressed }) => [styles.actionCard, pressed && styles.actionPressed]}
              onPress={() => router.push(action.href as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon as any} size={22} color={Colors.white} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Text style={styles.actionDesc} numberOfLines={1}>{action.desc}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>System Status</Text>
        </View>

        <View style={styles.statusCard}>
          {STATUS_ITEMS.map((item, i) => (
            <View key={item.key}>
              <View style={styles.statusRow}>
                <View style={styles.statusLeft}>
                  <Ionicons name={item.icon as any} size={18} color="#4CAF50" />
                  <Text style={styles.statusLabel}>{item.label}</Text>
                </View>
                <View style={styles.statusRight}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusValue}>Operational</Text>
                </View>
              </View>
              {i < STATUS_ITEMS.length - 1 ? <View style={styles.statusDivider} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={18} color={Colors.primary} />
          <Text style={styles.infoText}>
            Dashboard auto-refreshes every 60 seconds. Pull down to refresh manually.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: { fontSize: 26, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
  pendingBadge: {
    marginTop: Spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  pendingText: { fontSize: 10, fontWeight: '700' },

  sectionHeader: { marginBottom: Spacing.sm, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionPressed: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.primary,
    transform: [{ scale: 0.98 }],
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  actionDesc: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  statusRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  statusValue: { fontSize: 12, fontWeight: '600', color: '#4CAF50' },
  statusDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary + '08',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  infoText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },
})
