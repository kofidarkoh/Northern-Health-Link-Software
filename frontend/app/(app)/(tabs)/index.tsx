import { useCallback, useState } from 'react'
import { View, ScrollView, StyleSheet, Platform, Pressable, RefreshControl } from 'react-native'
import { Text, Card, FAB, Portal } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import { useAuth } from '../../../src/features/auth'
import { getRoutesForRole } from '../../../src/navigation/routes'
import { OfflineBanner } from '../../../src/components'
import { clinicalApi, patientsApi, deliveriesApi } from '../../../src/core/api'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import type { UserRole } from '../../../src/types'

const ROUTE_CONFIG: Record<string, { color: string; desc: string }> = {
  users:           { color: '#2D3E18', desc: 'Accounts & roles' },
  clinics:         { color: '#17A2B8', desc: 'Medical centers' },
  dashboard:       { color: '#FF8C00', desc: 'System analytics' },
  'audit-logs':    { color: '#6F42C1', desc: 'Activity tracking' },
  patients:        { color: '#DC3545', desc: 'Patient records' },
  appointments:    { color: '#FF8C00', desc: 'Schedule & manage' },
  'lab-requests':  { color: '#FFC107', desc: 'Test orders' },
  'lab-results':   { color: '#17A2B8', desc: 'View test results' },
  'lab-upload':    { color: '#DC3545', desc: 'Upload reports' },
  prescriptions:   { color: '#2D3E18', desc: 'Medication orders' },
  deliveries:      { color: '#6F42C1', desc: 'Rider dispatch' },
  consultations:   { color: '#17A2B8', desc: 'Notes & diagnosis' },
  sync:            { color: '#FFC107', desc: 'Offline data sync' },
}

const ROLE_ICON: Record<UserRole, string> = {
  ADMIN: 'shield-checkmark',
  SPECIALIST: 'medical',
  CLINIC_STAFF: 'people',
  LAB_OFFICER: 'flask',
  RIDER: 'bicycle',
}

const ROLE_FAB_ACTIONS: Record<UserRole, Array<{ icon: string; label: string; route: string }>> = {
  ADMIN: [
    { icon: 'account-plus', label: 'User', route: '/(app)/users/create' },
    { icon: 'office-building', label: 'Clinic', route: '/(app)/clinics/new' },
  ],
  SPECIALIST: [
    { icon: 'file-document', label: 'Consultation', route: '/(app)/consultations/new' },
    { icon: 'medical-bag', label: 'Prescription', route: '/(app)/prescriptions' },
  ],
  CLINIC_STAFF: [
    { icon: 'account-plus', label: 'Patient', route: '/(app)/patients/new' },
    { icon: 'calendar', label: 'Appointment', route: '/(app)/appointments/new' },
    { icon: 'flask', label: 'Lab Request', route: '/(app)/lab-requests/new' },
  ],
  LAB_OFFICER: [
    { icon: 'cloud-upload', label: 'Upload Result', route: '/(app)/lab-upload' },
  ],
  RIDER: [
    { icon: 'bicycle', label: 'Deliveries', route: '/(app)/deliveries' },
  ],
}

const ACTIVITY_ICONS: Record<string, { icon: string; color: string }> = {
  appointment: { icon: 'calendar', color: '#FF8C00' },
  lab_request: { icon: 'flask', color: '#FFC107' },
  prescription: { icon: 'medical', color: '#2D3E18' },
  delivery: { icon: 'bicycle', color: '#6F42C1' },
  patient: { icon: 'person', color: '#DC3545' },
  consultation: { icon: 'chatbubbles', color: '#17A2B8' },
}

function UrgencyCard({ title, count, icon, color, onPress }: {
  title: string
  count: number
  icon: string
  color: string
  onPress?: () => void
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.urgencyCard, pressed && styles.urgencyCardPressed]}
      onPress={onPress}
    >
      <View style={[styles.urgencyIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.urgencyBody}>
        <Text style={styles.urgencyCount}>{count}</Text>
        <Text style={styles.urgencyTitle} numberOfLines={1}>{title}</Text>
      </View>
      <View style={[styles.urgencyBadge, { backgroundColor: color + '20' }]}>
        <Text style={[styles.urgencyBadgeText, { color }]}>{count}</Text>
      </View>
    </Pressable>
  )
}

export default function HomeScreen() {
  const { user } = useAuth()
  const [fabOpen, setFabOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const { data: apptData, refetch: refetchAppts } = useQuery({
    queryKey: ['dashboard-appointments'],
    queryFn: () => clinicalApi.listAppointments({ per_page: 50 }),
  })

  const { data: labData, refetch: refetchLabs } = useQuery({
    queryKey: ['dashboard-lab-requests'],
    queryFn: () => clinicalApi.listLabRequests({}),
  })

  const { data: deliveryData, refetch: refetchDeliveries } = useQuery({
    queryKey: ['dashboard-deliveries'],
    queryFn: () => deliveriesApi.list({}),
  })

  const { data: patientData, refetch: refetchPatients } = useQuery({
    queryKey: ['dashboard-patients'],
    queryFn: () => patientsApi.list({ per_page: 50 }),
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchAppts(), refetchLabs(), refetchDeliveries(), refetchPatients()])
    setRefreshing(false)
  }, [])

  if (!user) return null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const dateStr = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  const routes = getRoutesForRole(user.role || 'CLINIC_STAFF')
  const firstName = user.full_name?.split(' ')[0] || 'User'
  const userRole = (user.role || 'CLINIC_STAFF') as UserRole

  const initials = user.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  const appointments = apptData?.appointments || []
  const labRequests = labData?.lab_requests || []
  const deliveries = deliveryData?.deliveries || []
  const patients = patientData?.patients || []

  const todayAppts = appointments.filter(a => {
    const d = new Date(a.appointment_time)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })
  const pendingAppts = todayAppts.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED')
  const pendingLabs = labRequests.filter(r => r.status === 'REQUESTED')
  const inTransitDeliveries = deliveries.filter(d => d.status === 'IN_TRANSIT' || d.status === 'PICKED_UP')

  const recentActivity = [
    ...appointments.slice(0, 2).map(a => ({
      type: 'appointment',
      title: `Appointment #${a.id}`,
      subtitle: `Status: ${a.status.replace('_', ' ')}`,
      time: new Date(a.appointment_time).toLocaleDateString(),
    })),
    ...labRequests.slice(0, 1).map(r => ({
      type: 'lab_request',
      title: r.test_type,
      subtitle: `Patient #${r.patient_id}`,
      time: new Date(r.created_at).toLocaleDateString(),
    })),
    ...deliveries.slice(0, 1).map(d => ({
      type: 'delivery',
      title: `Delivery #${d.id}`,
      subtitle: d.delivery_address,
      time: 'Active',
    })),
  ].slice(0, 5)

  const fabActions = ROLE_FAB_ACTIONS[userRole] || []

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
    >
      <OfflineBanner />

      <Card style={styles.banner} mode="contained">
        <Card.Content style={styles.bannerContent}>
          <View style={styles.bannerLeft}>
            <Text variant="labelMedium" style={styles.bannerDate}>{dateStr.toUpperCase()}</Text>
            <Text variant="headlineMedium" style={styles.bannerTitle}>{greeting},</Text>
            <Text variant="headlineMedium" style={styles.bannerName}>{firstName}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name={ROLE_ICON[userRole] as any} size={12} color={Colors.secondary} />
              <Text variant="labelSmall" style={styles.roleText}>
                {userRole.replace('_', ' ')}
              </Text>
            </View>
          </View>
          <View style={styles.bannerRight}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={styles.sectionTitle}>What Needs Attention</Text>
        <Text variant="bodySmall" style={styles.sectionSubtitle}>Today's overview</Text>
      </View>

      <View style={styles.urgencyGrid}>
        <UrgencyCard
          title="Appointments today"
          count={pendingAppts.length}
          icon="calendar"
          color={pendingAppts.length > 0 ? Colors.secondary : Colors.primary}
          onPress={() => router.push('/(app)/appointments')}
        />
        <UrgencyCard
          title="Lab results pending"
          count={pendingLabs.length}
          icon="flask"
          color={pendingLabs.length > 0 ? Colors.secondary : Colors.primary}
          onPress={() => router.push('/(app)/lab-requests')}
        />
        <UrgencyCard
          title="Deliveries in transit"
          count={inTransitDeliveries.length}
          icon="bicycle"
          color={inTransitDeliveries.length > 0 ? Colors.secondary : Colors.primary}
          onPress={() => router.push('/(app)/deliveries')}
        />
        <UrgencyCard
          title="Patients this week"
          count={patients.length}
          icon="people"
          color={Colors.primary}
          onPress={() => router.push('/(app)/patients')}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Modules</Text>
        <Text variant="bodySmall" style={styles.sectionSubtitle}>
          {routes.length} available
        </Text>
      </View>

      <View style={styles.grid}>
        {routes.map((route) => {
          const cfg = ROUTE_CONFIG[route.key] || { color: Colors.primary, desc: '' }
          return (
            <Pressable
              key={route.key}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(route.href as any)}
            >
              <View style={[styles.cardIcon, { backgroundColor: cfg.color }]}>
                <Ionicons name={route.icon as any} size={20} color={Colors.white} />
              </View>
              <Text style={styles.cardLabel}>{route.label}</Text>
              <Text style={styles.cardDesc} numberOfLines={1}>{cfg.desc}</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.textLight} style={styles.cardArrow} />
            </Pressable>
          )
        })}
      </View>

      {recentActivity.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Recent Activity</Text>
          </View>

          <View style={styles.timeline}>
            {recentActivity.map((item, idx) => {
              const cfg = ACTIVITY_ICONS[item.type] || { icon: 'ellipse', color: Colors.textSecondary }
              return (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: cfg.color + '20' }]}>
                      <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
                    </View>
                    {idx < recentActivity.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineBody}>
                    <Text style={styles.timelineTitle}>{item.title}</Text>
                    <Text style={styles.timelineSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Text style={styles.timelineTime}>{item.time}</Text>
                </View>
              )
            })}
          </View>
        </>
      )}

      <View style={styles.footer}>
        <Ionicons name="medkit" size={16} color={Colors.primary} />
        <Text style={styles.footerText}>Northern Health Link</Text>
      </View>

      <View style={{ height: 80 }} />

      <Portal>
        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? 'close' : 'plus'}
          actions={fabActions.map(action => ({
            icon: action.icon,
            label: action.label,
            onPress: () => {
              setFabOpen(false)
              router.push(action.route as any)
            },
          }))}
          onStateChange={({ open }) => setFabOpen(open)}
          style={styles.fabGroup}
          fabStyle={styles.fab}
        />
      </Portal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },

  banner: {
    backgroundColor: Colors.primary,
    marginBottom: Spacing.lg,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' },
      default: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  bannerLeft: { flex: 1 },
  bannerDate: { color: Colors.secondary, fontWeight: '700', letterSpacing: 1.5, fontSize: 10 },
  bannerTitle: { color: Colors.white, fontWeight: '600', marginTop: 4, fontSize: 18 },
  bannerName: { color: Colors.white, fontWeight: '800', fontSize: 26 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.25)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    gap: 6,
  },
  roleText: { color: Colors.secondary, fontWeight: '700', textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.8 },
  bannerRight: { marginLeft: Spacing.md },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 1,
  },

  sectionHeader: { marginBottom: Spacing.sm, paddingHorizontal: 4 },
  sectionTitle: { fontWeight: '800', color: Colors.text, letterSpacing: -0.3, fontSize: 18 },
  sectionSubtitle: { color: Colors.textSecondary, marginTop: 4, fontSize: 13 },

  urgencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  urgencyCard: {
    width: '47.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)' },
      default: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 3,
      },
    }),
  },
  urgencyCardPressed: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.primary,
    transform: [{ scale: 0.98 }],
  },
  urgencyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgencyBody: { flex: 1 },
  urgencyCount: { fontSize: 20, fontWeight: '800', color: Colors.text },
  urgencyTitle: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
  urgencyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgencyBadgeText: { fontSize: 12, fontWeight: '800' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'space-between' },
  card: {
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)' },
      default: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 3,
      },
    }),
  },
  cardPressed: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.primary,
    transform: [{ scale: 0.98 }],
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardLabel: { fontWeight: '700', color: Colors.text, letterSpacing: -0.3, fontSize: 14 },
  cardDesc: { color: Colors.textSecondary, fontSize: 11, marginTop: 4 },
  cardArrow: { position: 'absolute', top: Spacing.lg, right: Spacing.lg },

  timeline: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  timelineLeft: { alignItems: 'center', width: 32 },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  timelineBody: { flex: 1 },
  timelineTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  timelineSubtitle: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  timelineTime: { fontSize: 10, color: Colors.textLight, fontWeight: '500' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  footerText: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },

  fabGroup: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  fab: {
    backgroundColor: Colors.primary,
  },
})
