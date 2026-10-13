import { View, StyleSheet, Pressable, Platform } from 'react-native'
import React from 'react'
import { Text } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Screen, PageHeader, StatGrid } from '../../components'
import type { StatItem } from '../../components/ui/StatGrid'
import { Colors, Spacing } from '../../constants'

export interface DashboardStat extends StatItem {}

export interface DashboardAction {
  label: string
  desc: string
  href: string
  icon?: string
}

interface RoleDashboardProps {
  title: string
  subtitle: string
  stats: DashboardStat[]
  loading: boolean
  onRefresh: () => void
  actions: DashboardAction[]
  footer?: React.ReactNode
}

export function RoleDashboard({ title, subtitle, stats, loading, onRefresh, actions, footer }: RoleDashboardProps) {
  return (
    <Screen refreshing={loading} onRefresh={onRefresh}>
      <PageHeader title={title} subtitle={subtitle} showBack={false} />
      <StatGrid stats={stats} />
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.card}>
        {actions.map((action, i) => (
          <Pressable
            key={action.label}
            onPress={() => router.push(action.href as any)}
            accessibilityLabel={`${action.label}, ${action.desc}`}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.row,
              i < actions.length - 1 && styles.rowBorder,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.iconBubble}>
              <Ionicons name={(action.icon ?? 'grid') as any} size={18} color={Colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text variant="bodyMedium" style={styles.rowTitle} numberOfLines={1}>
                {action.label}
              </Text>
              <Text variant="bodySmall" style={styles.rowSub} numberOfLines={2}>
                {action.desc}
              </Text>
            </View>
            <View style={styles.chevronCircle}>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </View>
          </Pressable>
        ))}
      </View>
      {footer}
      <View style={{ height: Spacing.xl }} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(45,62,24,0.08)' },
      default: {
        shadowColor: '#2D3E18',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 3,
      },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    paddingVertical: Spacing.sm + 6,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  pressed: { backgroundColor: Colors.backgroundAlt },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowBody: { flex: 1 },
  rowTitle: { fontWeight: '700', color: Colors.text, fontSize: 15 },
  rowSub: { color: Colors.textSecondary, marginTop: 4, fontSize: 13 },
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
