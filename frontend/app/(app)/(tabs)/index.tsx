import React from 'react'
import { View, ScrollView, StyleSheet, Platform, Pressable } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import { useAuth } from '../../../src/features/auth'
import { getRoutesForRole } from '../../../src/navigation/routes'
import { OfflineBanner } from '../../../src/components'
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

export default function HomeScreen() {
  const { user } = useAuth()
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
        <Text variant="titleMedium" style={styles.sectionTitle}>Quick Actions</Text>
        <Text variant="bodySmall" style={styles.sectionSubtitle}>
          {routes.length} module{routes.length !== 1 ? 's' : ''} available
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

      <View style={styles.footer}>
        <Ionicons name="medkit" size={16} color={Colors.primary} />
        <Text style={styles.footerText}>Northern Health Link</Text>
      </View>
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

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  footerText: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },
})
