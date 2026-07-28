import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import { Colors, Spacing } from '../../constants'
import { formatStatus } from '../../utils/format'

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  REQUESTED: { bg: '#FFF3CD', fg: '#856404' },
  SCHEDULED: { bg: '#D4E6C3', fg: '#3B4318' },
  IN_PROGRESS: { bg: '#C5D9A8', fg: '#2D3A14' },
  COMPLETED: { bg: '#D4E6C3', fg: '#4B5320' },
  CANCELLED: { bg: '#F8D7DA', fg: '#C62828' },
  RESULT_UPLOADED: { bg: '#D4E6C3', fg: '#4B5320' },
  PENDING: { bg: '#FFF3CD', fg: '#856404' },
  PICKED_UP: { bg: '#D4E6C3', fg: '#3B4318' },
  IN_TRANSIT: { bg: '#C5D9A8', fg: '#2D3A14' },
  DELIVERED: { bg: '#D4E6C3', fg: '#4B5320' },
  FAILED: { bg: '#F8D7DA', fg: '#C62828' },
}

export function StatusChip({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? { bg: Colors.background, fg: Colors.textSecondary }
  return (
    <View style={[styles.chip, { backgroundColor: colors.bg }]}>
      <Text variant="labelSmall" style={[styles.text, { color: colors.fg }]}>
        {formatStatus(status)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: { fontWeight: '700', textTransform: 'uppercase', fontSize: 10 },
})
