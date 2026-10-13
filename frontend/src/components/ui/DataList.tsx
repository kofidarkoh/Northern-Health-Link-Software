import { type ReactNode } from 'react'
import { View, StyleSheet, Platform } from 'react-native'
import { Text, Searchbar, FAB, ActivityIndicator } from 'react-native-paper'
import { Colors, Spacing } from '../../constants'
import { ListRow } from './PageHeader'
import { EmptyState, ErrorView, LoadingView } from './Feedback'

interface DataListProps<T> {
  items: T[]
  loading: boolean
  error?: string | null
  search?: string
  onSearchChange?: (v: string) => void
  searchPlaceholder?: string
  renderTitle: (item: T) => string
  renderSubtitle?: (item: T) => string
  renderMeta?: (item: T) => string
  keyExtractor: (item: T) => string | number
  onPressItem?: (item: T) => void
  onRetry?: () => void
  emptyTitle?: string
  emptyMessage?: string
  fabLabel?: string
  onFabPress?: () => void
  footer?: ReactNode
}

export function DataList<T>({
  items,
  loading,
  error,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  renderTitle,
  renderSubtitle,
  renderMeta,
  keyExtractor,
  onPressItem,
  onRetry,
  emptyTitle = 'No records',
  emptyMessage,
  fabLabel,
  onFabPress,
  footer,
}: DataListProps<T>) {
  if (loading && items.length === 0) return <LoadingView />
  if (error && items.length === 0) return <ErrorView message={error} onRetry={onRetry} />

  return (
    <View style={styles.wrap}>
      {onSearchChange !== undefined ? (
        <Searchbar
          placeholder={searchPlaceholder}
          value={search ?? ''}
          onChangeText={onSearchChange}
          style={styles.search}
          inputStyle={styles.searchInput}
          placeholderTextColor={Colors.textLight}
        />
      ) : null}

      <View style={styles.list}>
        {items.length === 0 ? (
          <EmptyState title={emptyTitle} message={emptyMessage} />
        ) : (
          items.map((item) => (
            <ListRow
              key={keyExtractor(item)}
              title={renderTitle(item)}
              subtitle={renderSubtitle?.(item)}
              meta={renderMeta?.(item)}
              onPress={onPressItem ? () => onPressItem(item) : undefined}
            />
          ))
        )}
        {loading && items.length > 0 ? <ActivityIndicator color={Colors.primary} style={styles.loader} /> : null}
        {footer}
      </View>

      {fabLabel && onFabPress ? (
        <FAB icon="plus" label={fabLabel} style={styles.fab} onPress={onFabPress} color={Colors.white} />
      ) : null}
    </View>
  )
}

export function DetailCard({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <View style={styles.card}>
      {rows.map((row) => (
        <View key={row.label} style={styles.detailRow}>
          <Text variant="labelSmall" style={styles.label}>{row.label}</Text>
          <Text variant="bodyMedium" style={styles.value}>{row.value || '—'}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  search: { marginBottom: Spacing.md, backgroundColor: Colors.backgroundAlt, height: 48, borderRadius: 14, elevation: 0 },
  searchInput: { minHeight: 0, fontSize: 15 },
  list: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    minHeight: 120,
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)' },
      default: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 2,
      },
    }),
  },
  loader: { padding: Spacing.lg },
  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, backgroundColor: Colors.primary, borderRadius: 16, elevation: 6 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)' },
      default: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 2,
      },
    }),
  },
  detailRow: { gap: 4 },
  label: { color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 11 },
  value: { color: Colors.text, fontWeight: '600', fontSize: 15 },
})
