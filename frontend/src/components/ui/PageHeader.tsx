import React, { useContext } from 'react'
import { View, StyleSheet, Pressable, Platform } from 'react-native'
import { Text } from 'react-native-paper'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../constants'
import { AuthContext } from '../../features/auth/AuthProvider'

const ROLE_META: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  ADMIN: { icon: 'shield-checkmark', label: 'Admin', color: '#C62828', bg: '#FDECEA' },
  CLINIC_STAFF: { icon: 'people', label: 'Nurse', color: '#0277BD', bg: '#E1F5FE' },
  SPECIALIST: { icon: 'medical', label: 'Specialist', color: '#2E7D32', bg: '#E8F5E9' },
  LAB_OFFICER: { icon: 'flask', label: 'Lab', color: '#9A6D00', bg: '#FFF8E1' },
  RIDER: { icon: 'bicycle', label: 'Rider', color: '#5E35B1', bg: '#EDE7F6' },
}

function handleBack() {
  if (router.canGoBack()) {
    router.back()
  } else {
    router.replace('/(app)/(tabs)')
  }
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  showRole?: boolean
  compact?: boolean
  right?: React.ReactNode
}

/**
 * Slim clinical header: white surface, back chevron, title stack,
 * role tag. One language on every Stack screen; the green hero
 * lives only on Home.
 */
export function PageHeader({ title, subtitle, showBack = true, showRole = true, compact = false, right }: PageHeaderProps) {
  const auth = useContext(AuthContext)
  const role = auth?.user?.role
  const meta = role ? ROLE_META[role] : undefined

  return (
    <View style={[styles.bar, compact && styles.barCompact]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>
        ) : null}
        <View style={styles.titles}>
          <Text variant="titleMedium" style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text variant="bodySmall" style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        {showRole && meta ? (
          <View style={[styles.chip, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon as any} size={12} color={meta.color} />
            <Text style={[styles.chipText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        ) : null}
        {right}
      </View>
    </View>
  )
}

interface ListRowProps {
  title: string
  subtitle?: string
  meta?: string
  onPress?: () => void
  right?: React.ReactNode
}

export function ListRow({ title, subtitle, meta, onPress, right }: ListRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.rowItem, pressed && styles.pressed]} disabled={!onPress}>
      <View style={styles.rowBody}>
        <Text variant="bodyMedium" style={styles.rowTitle} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text variant="bodySmall" style={styles.rowSub} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {meta ? <Text variant="labelSmall" style={styles.meta}>{meta}</Text> : null}
      {right}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(22,34,12,0.08)' },
      default: {
        shadowColor: '#16220C',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 1,
      },
    }),
  },
  barCompact: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnPressed: { backgroundColor: Colors.backgroundAlt, transform: [{ scale: 0.95 }] },
  titles: { flex: 1 },
  title: { fontWeight: '800', color: Colors.text, letterSpacing: -0.3, fontSize: 19 },
  subtitle: { color: Colors.textSecondary, marginTop: 1, fontSize: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  chipText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  pressed: { backgroundColor: Colors.backgroundAlt },
  rowBody: { flex: 1 },
  rowTitle: { fontWeight: '700', color: Colors.text, fontSize: 15 },
  rowSub: { color: Colors.textSecondary, marginTop: 4, fontSize: 13 },
  meta: { color: Colors.textLight, fontSize: 12 },
})
