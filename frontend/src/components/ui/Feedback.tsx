import { View, StyleSheet, Platform } from 'react-native'
import { Text, Button, ActivityIndicator } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../constants'

export function EmptyState({
  icon = 'folder-open-outline',
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap
  title: string
  message?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={36} color={Colors.primary} />
      </View>
      <Text variant="titleSmall" style={styles.title}>{title}</Text>
      {message ? <Text variant="bodySmall" style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button mode="contained" onPress={onAction} buttonColor={Colors.primary} style={styles.btn} labelStyle={styles.btnLabel}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  )
}

export function LoadingView({ message = 'Loading…' }: { message?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text variant="bodyMedium" style={styles.message}>{message}</Text>
    </View>
  )
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.errorIcon}>
        <Ionicons name="alert-circle-outline" size={36} color={Colors.error} />
      </View>
      <Text variant="bodyMedium" style={styles.error}>{message}</Text>
      {onRetry ? (
        <Button mode="contained" onPress={onRetry} buttonColor={Colors.primary} labelStyle={styles.btnLabel}>
          Retry
        </Button>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' },
      default: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' },
      default: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  title: { fontWeight: '700', color: Colors.text, marginTop: Spacing.md, fontSize: 16 },
  message: { color: Colors.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  error: { color: Colors.error, textAlign: 'center', fontWeight: '600', fontSize: 15 },
  btn: { marginTop: Spacing.md, borderRadius: 12 },
  btnLabel: { color: Colors.white, fontWeight: '700', letterSpacing: 0.5 },
})
