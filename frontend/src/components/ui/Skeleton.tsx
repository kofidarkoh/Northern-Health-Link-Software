import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Platform } from 'react-native'
import { Colors, Spacing } from '../../constants'

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: any
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: Colors.border, opacity },
        style,
      ]}
    />
  )
}

export function SkeletonCard({ lines = 3, style }: { lines?: number; style?: any }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={44} height={44} borderRadius={12} />
        <View style={styles.cardHeaderLines}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '70%' : '100%'} height={12} style={{ marginTop: 10 }} />
      ))}
    </View>
  )
}

export function SkeletonList({ count = 5, style }: { count?: number; style?: any }) {
  return (
    <View style={[styles.list, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </View>
  )
}

export function SkeletonStats({ count = 3, style }: { count?: number; style?: any }) {
  return (
    <View style={[styles.statsRow, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.statCard}>
          <Skeleton width={28} height={28} borderRadius={8} />
          <Skeleton width={30} height={20} style={{ marginTop: 8 }} />
          <Skeleton width={50} height={10} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: 4,
  },
  cardHeaderLines: { flex: 1 },
  statsRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
})
