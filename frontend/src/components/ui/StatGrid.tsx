import { View, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import { Colors, Spacing } from '../../constants'
import { useResponsive } from '../../utils/responsive'

interface StatItem {
  label: string
  value: number | string
}

export function StatGrid({ stats }: { stats: StatItem[] }) {
  const { columns } = useResponsive()
  const width = `${100 / Math.min(columns, stats.length || 1) - 2}%` as `${number}%`

  return (
    <View style={styles.grid}>
      {stats.map((s) => (
        <View key={s.label} style={[styles.item, { width }]}>
          <Text variant="headlineSmall" style={styles.value}>{s.value}</Text>
          <Text variant="labelSmall" style={styles.label}>{s.label}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  item: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: Spacing.sm,
    minWidth: 100,
  },
  value: { fontWeight: '700', color: Colors.primary },
  label: { color: Colors.textSecondary, marginTop: 2 },
})
