import React from 'react'
import { View, ScrollView, StyleSheet, ViewStyle, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Spacing } from '../../constants'
import { useResponsive } from '../../utils/responsive'

interface ScreenProps {
  children: React.ReactNode
  scroll?: boolean
  padded?: boolean
  refreshing?: boolean
  onRefresh?: () => void
  style?: ViewStyle
}

export function Screen({ children, scroll = true, padded = true, refreshing, onRefresh, style }: ScreenProps) {
  const insets = useSafeAreaInsets()
  const { contentWidth } = useResponsive()

  const content = (
    <View style={[styles.inner, padded && styles.padded, { maxWidth: contentWidth, width: '100%' }]}>
      {children}
    </View>
  )

  if (!scroll) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }, style]}>
        {content}
      </View>
    )
  }

  return (
    <ScrollView
      style={[styles.root, style]}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.lg }]}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} /> : undefined}
      keyboardShouldPersistTaps="handled"
    >
      {content}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  inner: { alignSelf: 'center' },
  padded: { paddingHorizontal: Spacing.lg },
})
