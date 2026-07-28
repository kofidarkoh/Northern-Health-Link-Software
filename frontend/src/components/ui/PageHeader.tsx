import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Text, IconButton } from 'react-native-paper'
import { router } from 'expo-router'
import { Colors, Spacing } from '../../constants'

interface PageHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  right?: React.ReactNode
}

export function PageHeader({ title, subtitle, showBack = true, right }: PageHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {showBack ? (
          <IconButton icon="arrow-left" size={20} onPress={() => router.back()} iconColor={Colors.text} style={styles.back} />
        ) : null}
        <View style={styles.titles}>
          <Text variant="titleMedium" style={styles.title}>{title}</Text>
          {subtitle ? <Text variant="bodySmall" style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  back: { margin: 0, marginRight: -4 },
  titles: { flex: 1 },
  title: { fontWeight: '800', color: Colors.text, fontSize: 20, letterSpacing: -0.3 },
  subtitle: { color: Colors.textSecondary, marginTop: 4, fontSize: 13 },
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
