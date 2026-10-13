import { View, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants'
import { ROLE_COLORS, ROLE_TEXT_COLORS, ROLE_LABELS, ROLE_ICONS } from '../../constants/roles'
import type { UserRole } from '../../types'

interface RolePillProps {
  role: UserRole
  size?: 'sm' | 'md'
  fixedWidth?: boolean
}

export function RolePill({ role, size = 'sm', fixedWidth = false }: RolePillProps) {
  const bg = (ROLE_COLORS[role] ?? Colors.textSecondary) + '22'
  const textColor = ROLE_TEXT_COLORS[role] ?? Colors.textSecondary
  const icon = ROLE_ICONS[role] ?? 'person'
  const label = ROLE_LABELS[role] ?? role.replace('_', ' ')

  return (
    <View
      style={[styles.wrap, fixedWidth && styles.fixed]}
      accessibilityLabel={`Role: ${label}`}
      accessibilityRole="text"
    >
      <View style={[styles.pill, size === 'md' ? styles.md : styles.sm, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={12} color={textColor} />
        <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start' },
  fixed: { minWidth: 118 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 20,
  },
  sm: { paddingHorizontal: 10, paddingVertical: 5 },
  md: { paddingHorizontal: 12, paddingVertical: 6 },
  text: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
})
