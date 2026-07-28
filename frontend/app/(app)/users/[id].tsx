import { useState } from 'react'
import { StyleSheet, ScrollView, View } from 'react-native'
import { Text, Avatar, Button, TextInput, Switch, Portal, Modal } from 'react-native-paper'
import { Screen, PageHeader } from '../../../src/components'
import { adminApi } from '../../../src/core/api/adminApi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import type { User, UserRole } from '../../../src/types'

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: '#DC3545',
  SPECIALIST: '#2D3E18',
  CLINIC_STAFF: '#17A2B8',
  LAB_OFFICER: '#FFC107',
  RIDER: '#6F42C1',
}

const ROLE_ICONS: Record<UserRole, string> = {
  ADMIN: 'shield-checkmark',
  SPECIALIST: 'medical',
  CLINIC_STAFF: 'people',
  LAB_OFFICER: 'flask',
  RIDER: 'bicycle',
}

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editSpeciality, setEditSpeciality] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.listUsers(),
    select: (d) => d.users?.find((u) => u.id === Number(id)),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => adminApi.updateUser(Number(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteUser(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setShowDeleteModal(false)
      router.back()
    },
  })

  const user = data as User | undefined

  function startEdit() {
    if (!user) return
    setEditName(user.full_name)
    setEditSpeciality(user.speciality || '')
    setEditing(true)
  }

  function saveEdit() {
    if (!editName.trim()) return
    updateMutation.mutate({ full_name: editName.trim(), speciality: editSpeciality.trim() || null })
  }

  function toggleActive() {
    if (!user) return
    updateMutation.mutate({ active: !user.active })
  }

  function handleDelete() {
    deleteMutation.mutate()
  }

  if (isLoading || !user) {
    return (
      <Screen>
        <PageHeader title="User Details" />
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Screen>
    )
  }

  const roleColor = ROLE_COLORS[user.role] || Colors.textSecondary
  const roleIcon = ROLE_ICONS[user.role] || 'person'
  const initials = user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <Screen>
      <PageHeader title="User Details" />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Avatar.Text
              size={80}
              label={initials}
              style={[styles.avatar, { backgroundColor: roleColor + '15' }]}
              labelStyle={[styles.avatarLabel, { color: roleColor }]}
            />
            <View style={[styles.statusDot, { backgroundColor: user.active ? '#4CAF50' : Colors.textLight }]} />
          </View>

          {editing ? (
            <TextInput
              value={editName}
              onChangeText={setEditName}
              mode="outlined"
              style={styles.editInput}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 10 }}
            />
          ) : (
            <Text style={styles.userName}>{user.full_name}</Text>
          )}

           <Text style={styles.userEmail}>{user.email}</Text>

          <View style={styles.userIdRow}>
            <Ionicons name="id-card" size={16} color={Colors.primary} />
            <Text style={styles.userIdText}>{user.user_id}</Text>
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + '15' }]}>
              <Ionicons name={roleIcon as any} size={14} color={roleColor} />
              <Text style={[styles.roleBadgeText, { color: roleColor }]}>
                {user.role.replace('_', ' ')}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: user.active ? Colors.successLight : Colors.backgroundAlt }]}>
              <Text style={[styles.statusBadgeText, { color: user.active ? Colors.primary : Colors.textLight }]}>
                {user.active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="mail-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="person-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              {editing ? (
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  mode="outlined"
                  dense
                  style={styles.editInputSmall}
                  outlineColor={Colors.border}
                  activeOutlineColor={Colors.primary}
                  theme={{ roundness: 8 }}
                />
              ) : (
                <Text style={styles.infoValue}>{user.full_name}</Text>
              )}
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="ribbon-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>{user.role.replace('_', ' ')}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="medkit" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Speciality</Text>
              {editing ? (
                <TextInput
                  value={editSpeciality}
                  onChangeText={setEditSpeciality}
                  mode="outlined"
                  dense
                  placeholder="e.g. Cardiology"
                  style={styles.editInputSmall}
                  outlineColor={Colors.border}
                  activeOutlineColor={Colors.primary}
                  theme={{ roundness: 8 }}
                />
              ) : (
                <Text style={styles.infoValue}>{user.speciality || '—'}</Text>
              )}
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>
                {new Date(user.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name={user.active ? 'checkmark-circle' : 'pause-circle'} size={22} color={user.active ? '#4CAF50' : Colors.textLight} />
              <View>
                <Text style={styles.toggleLabel}>{user.active ? 'Active' : 'Inactive'}</Text>
                <Text style={styles.toggleHint}>
                  {user.active ? 'User can log in and access the system' : 'User is blocked from logging in'}
                </Text>
              </View>
            </View>
            <Switch
              value={user.active}
              onValueChange={toggleActive}
              color={Colors.primary}
              disabled={updateMutation.isPending}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>

          {editing ? (
            <View style={styles.editActions}>
              <Button mode="outlined" onPress={() => setEditing(false)} style={styles.actionBtn}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={saveEdit}
                loading={updateMutation.isPending}
                disabled={updateMutation.isPending}
                buttonColor={Colors.primary}
                style={styles.actionBtn}
              >
                Save Changes
              </Button>
            </View>
          ) : (
            <Button
              mode="outlined"
              onPress={startEdit}
              icon="pencil"
              style={styles.fullActionBtn}
              labelStyle={styles.actionLabel}
            >
              Edit Profile
            </Button>
          )}

          <Button
            mode="outlined"
            onPress={() => setShowDeleteModal(true)}
            icon="trash"
            textColor={Colors.error}
            style={[styles.fullActionBtn, { borderColor: Colors.error + '40' }]}
            labelStyle={[styles.actionLabel, { color: Colors.error }]}
          >
            Delete User
          </Button>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Portal>
        <Modal visible={showDeleteModal} onDismiss={() => setShowDeleteModal(false)} contentContainerStyle={styles.modalContent}>
          <View style={styles.modalIcon}>
            <Ionicons name="warning" size={40} color={Colors.error} />
          </View>
          <Text style={styles.modalTitle}>Delete User?</Text>
          <Text style={styles.modalBody}>
            This will permanently remove <Text style={{ fontWeight: '700' }}>{user.full_name}</Text> from the system. This action cannot be undone.
          </Text>
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowDeleteModal(false)} style={styles.modalBtn}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleDelete}
              loading={deleteMutation.isPending}
              disabled={deleteMutation.isPending}
              buttonColor={Colors.error}
              style={styles.modalBtn}
            >
              Delete
            </Button>
          </View>
        </Modal>
      </Portal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textSecondary, fontSize: 15 },

  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  avatar: { borderWidth: 3, borderColor: Colors.border },
  avatarLabel: { fontWeight: '800', fontSize: 28 },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  userName: { fontSize: 22, fontWeight: '800', color: Colors.text },
  userEmail: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  userIdRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, backgroundColor: Colors.primaryLight + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start' },
  userIdText: { fontSize: 16, fontWeight: '800', color: Colors.primary, letterSpacing: 1 },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },

  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '08',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue: { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: 2 },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  toggleHint: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  fullActionBtn: {
    borderRadius: 12,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  actionLabel: { fontWeight: '600', color: Colors.text },
  editActions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flex: 1, borderRadius: 12 },

  editInput: { width: '100%', marginBottom: Spacing.sm, backgroundColor: Colors.backgroundAlt },
  editInputSmall: { marginTop: 4, backgroundColor: Colors.backgroundAlt },

  modalContent: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    margin: Spacing.lg,
    borderRadius: 20,
    alignItems: 'center',
  },
  modalIcon: { marginBottom: Spacing.md },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  modalBody: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg, width: '100%' },
  modalBtn: { flex: 1, borderRadius: 12 },
})
