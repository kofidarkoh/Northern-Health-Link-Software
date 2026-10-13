import { View, StyleSheet, Platform } from 'react-native'
import { Text } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../constants'
import { useResponsive } from '../../utils/responsive'

export interface StatItem {
  label: string
  value: number | string
  icon?: string
  tint?: string
}

export function StatGrid({ stats }: { stats: StatItem[] }) {
  const { width: screenWidth } = useResponsive()
  const cols =
    stats.length <= 1 ? 1 : screenWidth >= 1024 ? 3 : screenWidth >= 768 ? Math.min(3, stats.length) : 2
  const basis = `${100 / cols - 1.5}%` as `${number}%`

  return (
    <View style={styles.grid}>
      {stats.map((s) => {
        const tint = s.tint ?? Colors.primary
        return (
          <View key={s.label} style={[styles.item, { flexBasis: basis }]}>
            <View style={styles.topRow}>
              {s.icon ? (
                <View style={[styles.iconBubble, { backgroundColor: tint + '14' }]}>
                  <Ionicons name={s.icon as any} size={18} color={tint} />
                </View>
              ) : null}
              <Text variant="headlineSmall" style={styles.value}>
                {s.value}
              </Text>
            </View>
            <Text variant="labelSmall" style={styles.label}>
              {s.label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  item: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.md,
    minHeight: 92,
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
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
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: { fontWeight: '800', color: Colors.text, fontSize: 22, letterSpacing: -0.5 },
  label: { color: Colors.textSecondary, marginTop: 6, fontSize: 12, fontWeight: '600' },
})
