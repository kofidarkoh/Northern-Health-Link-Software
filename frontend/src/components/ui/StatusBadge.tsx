import { View, StyleSheet, ViewStyle } from 'react-native'
import { Text } from 'react-native-paper'
import { Colors } from '../../constants'

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'
type StatusShape = 'circle' | 'triangle' | 'square' | 'pill'

interface StatusBadgeProps {
  label: string
  variant?: StatusVariant
  shape?: StatusShape
  size?: 'sm' | 'md' | 'lg'
  style?: ViewStyle
}

const variantColors: Record<StatusVariant, { bg: string; text: string }> = {
  success: { bg: '#D4EDDA', text: '#155724' },
  warning: { bg: '#FFF3CD', text: '#856404' },
  error: { bg: '#F8D7DA', text: '#721C24' },
  info: { bg: '#D1ECF1', text: '#0C5460' },
  neutral: { bg: Colors.border, text: Colors.textSecondary },
}

function StatusShapeIndicator({ variant, size }: { variant: StatusVariant; size: number }) {
  const color = variantColors[variant].text
  const s = size * 0.4

  if (variant === 'warning') {
    return (
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: s / 2, borderRightWidth: s / 2,
        borderBottomWidth: s, borderLeftColor: 'transparent',
        borderRightColor: 'transparent', borderBottomColor: color,
        marginRight: 6,
      }} />
    )
  }
  if (variant === 'error') {
    return <View style={{ width: s, height: s, backgroundColor: color, borderRadius: 2, marginRight: 6 }} />
  }
  return <View style={{ width: s, height: s, borderRadius: s / 2, backgroundColor: color, marginRight: 6 }} />
}

export function StatusBadge({ label, variant = 'neutral', shape = 'pill', size = 'md', style }: StatusBadgeProps) {
  const colors = variantColors[variant]
  const sizeMap = { sm: 12, md: 13, lg: 15 }

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      {shape !== 'pill' && <StatusShapeIndicator variant={variant} size={20} />}
      <Text style={[styles.text, { color: colors.text, fontSize: sizeMap[size] }]}>{label}</Text>
    </View>
  )
}

export function getStatusVariant(status: string): StatusVariant {
  const s = status.toLowerCase()
  if (['completed', 'delivered', 'active', 'resolved', 'result_uploaded'].includes(s)) return 'success'
  if (['in_progress', 'in_transit', 'scheduled', 'picked_up', 'pending'].includes(s)) return 'warning'
  if (['failed', 'cancelled', 'overdue', 'emergency'].includes(s)) return 'error'
  if (['requested', 'new', 'unread'].includes(s)) return 'info'
  return 'neutral'
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  text: { fontWeight: '600' },
})
