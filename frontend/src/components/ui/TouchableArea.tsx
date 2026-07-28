import React from 'react'
import { Pressable, StyleSheet, ViewStyle } from 'react-native'

interface TouchableAreaProps {
  onPress?: () => void
  children: React.ReactNode
  style?: ViewStyle
  disabled?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
}

export function TouchableArea({ onPress, children, style, disabled, accessibilityLabel, accessibilityHint }: TouchableAreaProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      style={[styles.touchArea, style, disabled && styles.disabled]}
    >
      {children}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  touchArea: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
})