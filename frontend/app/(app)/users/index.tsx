import { useState, useCallback } from 'react'
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native'
import { Screen, PageHeader, UserCard } from '../../../src/components'
import { adminApi } from '../../../src/core/api/adminApi'
import { useQuery } from '@tanstack/react-query'
import { Text, Chip, Searchbar, FAB, Button } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import { SkeletonList } from '../../../src/components/ui/Skeleton'
import { router } from 'expo-router'
import type { UserRole } from '../../../src/types'

const ROLES: UserRole[] = ['ADMIN', 'CLINIC_STAFF', 'SPECIALIST', 'LAB_OFFICER', 'RIDER']

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: '#DC3545',
  SPECIALIST: '#2D3E18',
  CLINIC_STAFF: '#17A2B8',
  LAB_OFFICER: '#FFC107',
  RIDER: '#6F42C1',
}

export default function UsersScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL')
  const [refreshing, setRefreshing] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', roleFilter],
    queryFn: () => adminApi.listUsers(roleFilter !== 'ALL' ? { role: roleFilter } : undefined),
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const allUsers = data?.users || []
  const filteredUsers = allUsers.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const totalActive = allUsers.filter(u => u.active).length
  const totalInactive = allUsers.length - totalActive
  const roleCounts = ROLES.reduce((acc, role) => {
    acc[role] = allUsers.filter(u => u.role === role).length
    return acc
  }, {} as Record<UserRole, number>)

  if (isLoading) {
    return (
      <Screen>
        <PageHeader title="Users" showBack={false} />
        <View style={{ padding: Spacing.md }}>
          <SkeletonList count={5} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <PageHeader
        title="Users"
        subtitle="Manage System Accounts"
        showBack={false}
      />

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: Colors.primary + '15' }]}>
              <Ionicons name="people" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statNumber}>{allUsers.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#4CAF50' + '15' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            </View>
            <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{totalActive}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: Colors.textLight + '20' }]}>
              <Ionicons name="pause-circle" size={20} color={Colors.textLight} />
            </View>
            <Text style={[styles.statNumber, { color: Colors.textLight }]}>{totalInactive}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        </View>

        <View style={styles.roleBreakdown}>
          {ROLES.map(role => (
            <View key={role} style={styles.roleStat}>
              <View style={[styles.roleDot, { backgroundColor: ROLE_COLORS[role] }]} />
              <Text style={styles.roleStatLabel}>{role.replace('_', ' ')}</Text>
              <Text style={styles.roleStatCount}>{roleCounts[role]}</Text>
            </View>
          ))}
        </View>

        <Searchbar
          placeholder="Search by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.search}
          mode="bar"
        />

        <View style={styles.chipScroll}>
          <Chip
            selected={roleFilter === 'ALL'}
            onPress={() => setRoleFilter('ALL')}
            style={styles.chip}
            selectedColor={Colors.primary}
            showSelectedOverlay
          >
            All ({allUsers.length})
          </Chip>
          {ROLES.map(role => (
            <Chip
              key={role}
              selected={roleFilter === role}
              onPress={() => setRoleFilter(role)}
              style={styles.chip}
              selectedColor={ROLE_COLORS[role]}
              showSelectedOverlay
            >
              {role.replace('_', ' ')} ({roleCounts[role]})
            </Chip>
          ))}
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {roleFilter === 'ALL' ? 'All Users' : roleFilter.replace('_', ' ')}
          </Text>
          <Text style={styles.listCount}>{filteredUsers.length} users</Text>
        </View>

        {filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="person-add-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No users yet</Text>
            <Text style={styles.emptySubtitle}>Tap the + button to create your first user</Text>
            <Button mode="contained" onPress={() => router.push('/(app)/users/create')} style={{ marginTop: 16, backgroundColor: Colors.primary }}>
              Create User
            </Button>
          </View>
        ) : (
          filteredUsers.map(user => (
            <UserCard
              key={user.id}
              user={user}
              onPress={() => router.push({ pathname: '/(app)/users/[id]', params: { id: String(user.id) } })}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB
        icon="plus"
        label="Add User"
        style={styles.fab}
        onPress={() => router.push('/(app)/users/create')}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statNumber: { fontSize: 22, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },

  roleBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleDot: { width: 8, height: 8, borderRadius: 4 },
  roleStatLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  roleStatCount: { fontSize: 12, fontWeight: '800', color: Colors.text },

  search: { marginBottom: Spacing.sm, elevation: 0, backgroundColor: Colors.surface, borderRadius: 12 },

  chipScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  chip: { marginBottom: Spacing.xs },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  listTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  listCount: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },

  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  emptyHint: { fontSize: 13, color: Colors.textLight },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    backgroundColor: Colors.primary,
  },
})
