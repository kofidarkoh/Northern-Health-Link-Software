import React from 'react'
import { View, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native'
import { Text, Button } from 'react-native-paper'
import { Colors, Spacing } from '../../../src/constants'
import { Ionicons } from '@expo/vector-icons'
import { useNotifications, useMarkAllNotificationsRead } from '../../../src/features/notifications/useNotifications'
import { getApiErrorMessage } from '../../../src/utils/apiError'
import { ErrorView } from '../../../src/components'

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  appointment: { icon: 'calendar', color: '#17A2B8' },
  consultation: { icon: 'chatbubbles', color: '#2D3E18' },
  lab_result: { icon: 'flask', color: '#FF8C00' },
  prescription: { icon: 'medkit', color: '#DC3545' },
  delivery: { icon: 'bicycle', color: '#6F42C1' },
  system: { icon: 'settings', color: '#6C757D' },
  general: { icon: 'notifications', color: Colors.primary },
}

function timeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function NotificationsScreen() {
  const { data, isLoading, error, refetch } = useNotifications()
  const markAllRead = useMarkAllNotificationsRead()
  const notifications = data?.notifications ?? []
  const unreadCount = notifications.filter(n => !n.read_at).length

  if (isLoading) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptySub}>Loading notifications...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.empty}>
        <ErrorView message={getApiErrorMessage(error)} onRetry={refetch} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={() => markAllRead.mutate()} style={styles.markAllBtn} accessibilityLabel="Mark all notifications as read">
            <Ionicons name="checkmark-done" size={16} color={Colors.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={48} color={Colors.primaryLight} />
          </View>
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptySub}>You're all caught up!</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />}
        >
          {notifications.map(n => {
            const isUnread = !n.read_at
            const typeCfg = (n.notification_type && TYPE_ICONS[n.notification_type]) || TYPE_ICONS.general
            return (
              <View key={n.id} style={[styles.card, isUnread && styles.cardUnread]}>
                <View style={[styles.iconCircle, { backgroundColor: typeCfg.color + '15' }]}>
                  <Ionicons name={typeCfg.icon as any} size={20} color={typeCfg.color} />
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, isUnread && styles.cardTitleUnread]} numberOfLines={1}>{n.title}</Text>
                    <Text style={styles.timeAgo}>{timeAgo(n.created_at)}</Text>
                  </View>
                  <Text style={styles.cardMessage} numberOfLines={2}>{n.message}</Text>
                </View>
                {isUnread && <View style={styles.unreadDot} />}
              </View>
            )
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, paddingBottom: Spacing.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
  badge: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  markAllText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },

  list: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, marginHorizontal: Spacing.md, marginBottom: Spacing.sm, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  cardUnread: { backgroundColor: Colors.primaryLight + '08', borderColor: Colors.primaryLight + '30' },
  iconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1, marginRight: 8 },
  cardTitleUnread: { fontWeight: '800' },
  timeAgo: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  cardMessage: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { width: 80, height: 80, borderRadius: 20, backgroundColor: Colors.successLight, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptySub: { color: Colors.textSecondary, marginTop: Spacing.xs },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
})
