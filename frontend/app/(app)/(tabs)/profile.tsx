import React, { useState } from 'react'
import { ScrollView, StyleSheet, View, Platform, Pressable } from 'react-native'
import { Text, Avatar, Switch, Portal, Modal, Button } from 'react-native-paper'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { Colors, Spacing } from '../../../src/constants'
import { useAuth } from '../../../src/features/auth'
import { useOfflineStore } from '../../../src/features/offline/offlineStore'
import { OfflineBanner } from '../../../src/components'
import type { UserRole } from '../../../src/types'

const APP_VERSION = '1.0.0'

const ROLE_CONFIG: Record<UserRole, { icon: string; color: string }> = {
  ADMIN: { icon: 'shield-checkmark', color: '#DC3545' },
  SPECIALIST: { icon: 'medical', color: '#2D3E18' },
  CLINIC_STAFF: { icon: 'people', color: '#17A2B8' },
  LAB_OFFICER: { icon: 'flask', color: '#FFC107' },
  RIDER: { icon: 'bicycle', color: '#6F42C1' },
}

interface SettingItem {
  icon: string
  iconColor?: string
  iconBg?: string
  label: string
  desc: string
  onPress?: () => void
  right?: React.ReactNode
  destructive?: boolean
}

function SettingRow({ item }: { item: SettingItem }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && item.onPress && styles.rowPressed]}
      onPress={item.onPress}
      disabled={!item.onPress}
      accessibilityLabel={item.label}
      accessibilityRole="button"
    >
      <View style={[styles.rowIcon, { backgroundColor: (item.iconBg || item.iconColor || Colors.primary) + '12' }]}>
        <Ionicons name={item.icon as any} size={18} color={item.iconColor || Colors.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, item.destructive && { color: Colors.error }]}>{item.label}</Text>
        <Text style={styles.rowDesc}>{item.desc}</Text>
      </View>
      {item.right || (item.onPress ? <Ionicons name="chevron-forward" size={16} color={Colors.textLight} /> : null)}
    </Pressable>
  )
}

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const { isOfflineMode, toggleOfflineMode, queue, lastSyncAt } = useOfflineStore()
  const [pushEnabled, setPushEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!user) return null

  const displayName = user.full_name || 'User'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const userRole = (user.role || 'CLINIC_STAFF') as UserRole
  const roleCfg = ROLE_CONFIG[userRole] || ROLE_CONFIG.CLINIC_STAFF

  async function handleLogout() {
    setIsLoggingOut(true)
    setShowLogoutModal(false)
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoggingOut(false)
      router.replace('/(auth)/login')
    }
  }

  async function copyUserId() {
    if (!user) return
    await Clipboard.setStringAsync(user.user_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const accountItems: SettingItem[] = [
    { icon: 'mail', iconColor: '#17A2B8', label: 'Email', desc: user.email },
    { icon: roleCfg.icon, iconColor: roleCfg.color, label: 'Role', desc: userRole.replace('_', ' ') },
    ...(user.speciality ? [{ icon: 'medical', iconColor: '#2D3E18', label: 'Speciality', desc: user.speciality }] : []),
    ...(user.clinic_id ? [{ icon: 'business', iconColor: '#FF8C00', label: 'Clinic', desc: `ID #${user.clinic_id}` }] : []),
  ]

  const settingsItems: SettingItem[] = [
    { icon: 'create', iconColor: '#17A2B8', label: 'Edit Profile', desc: 'Update name and phone', onPress: () => router.push('/(app)/profile/edit') },
    { icon: 'key', iconColor: '#FFC107', label: 'Change Password', desc: 'Update your password', onPress: () => router.push('/(app)/profile/change-password') },
  ]

  const notifItems: SettingItem[] = [
    { icon: 'notifications', iconColor: '#FF8C00', label: 'Push Notifications', desc: 'Receive alerts on device', right: <Switch value={pushEnabled} onValueChange={setPushEnabled} color={Colors.primary} /> },
    { icon: 'mail-open', iconColor: '#6F42C1', label: 'Email Notifications', desc: 'Receive updates via email', right: <Switch value={emailEnabled} onValueChange={setEmailEnabled} color={Colors.primary} /> },
  ]

  const offlineItems: SettingItem[] = [
    { icon: isOfflineMode ? 'cloud-offline' : 'cloud-done', iconColor: isOfflineMode ? '#FFC107' : '#4CAF50', label: 'Offline Mode', desc: isOfflineMode ? 'Queuing actions locally' : 'Connected to server', right: <Switch value={isOfflineMode} onValueChange={toggleOfflineMode} color={Colors.warning} /> },
    { icon: 'sync', iconColor: '#17A2B8', label: 'Sync Status', desc: queue.length === 0 ? 'All synced' : `${queue.length} pending`, onPress: () => router.push('/(app)/sync') },
  ]

  const sessionItems: SettingItem[] = [
    { icon: 'phone-portrait', iconColor: '#2D3E18', label: 'Device', desc: Platform.OS === 'web' ? 'Web Browser' : Platform.OS === 'ios' ? 'iOS Device' : 'Android Device' },
    ...(lastSyncAt ? [{ icon: 'time', iconColor: '#FF8C00', label: 'Last Sync', desc: new Date(lastSyncAt).toLocaleString() }] : []),
  ]

  const aboutItems: SettingItem[] = [
    { icon: 'information-circle', iconColor: '#17A2B8', label: 'Northern Health Link', desc: `Version ${APP_VERSION}` },
    { icon: 'document-text', iconColor: '#6F42C1', label: 'Privacy Policy', desc: 'How we handle your data', onPress: () => {} },
    { icon: 'chatbubble-ellipses', iconColor: '#4CAF50', label: 'Contact Support', desc: 'Get help with your account', onPress: () => {} },
  ]

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <OfflineBanner />

      <View style={styles.profileHeader}>
        <View style={styles.avatarWrap}>
          <Avatar.Text
            size={80}
            label={initials}
            style={[styles.avatar, { backgroundColor: roleCfg.color + '15' }]}
            labelStyle={[styles.avatarLabel, { color: roleCfg.color }]}
          />
          <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleCfg.color + '12' }]}>
          <Ionicons name={roleCfg.icon as any} size={14} color={roleCfg.color} />
          <Text style={[styles.roleText, { color: roleCfg.color }]}>{userRole.replace('_', ' ')}</Text>
        </View>

        <Pressable style={styles.userIdCard} onPress={copyUserId}>
          <View style={styles.userIdLeft}>
            <View style={[styles.userIdIcon, { backgroundColor: roleCfg.color + '15' }]}>
              <Ionicons name="id-card" size={20} color={roleCfg.color} />
            </View>
            <View>
              <Text style={styles.userIdLabel}>Your User ID</Text>
              <Text style={styles.userIdValue}>{user.user_id}</Text>
            </View>
          </View>
          <View style={[styles.copyBtn, copied && styles.copyBtnActive]}>
            <Ionicons name={copied ? 'checkmark' : 'copy'} size={16} color={copied ? '#fff' : Colors.primary} />
          </View>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionCard}>
          {accountItems.map((item, i) => (
            <React.Fragment key={item.label}>
              <SettingRow item={item} />
              {i < accountItems.length - 1 ? <View style={styles.divider} /> : null}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.sectionCard}>
          {settingsItems.map((item, i) => (
            <React.Fragment key={item.label}>
              <SettingRow item={item} />
              {i < settingsItems.length - 1 ? <View style={styles.divider} /> : null}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.sectionCard}>
          {notifItems.map((item, i) => (
            <React.Fragment key={item.label}>
              <SettingRow item={item} />
              {i < notifItems.length - 1 ? <View style={styles.divider} /> : null}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline & Sync</Text>
        <View style={styles.sectionCard}>
          {offlineItems.map((item, i) => (
            <React.Fragment key={item.label}>
              <SettingRow item={item} />
              {i < offlineItems.length - 1 ? <View style={styles.divider} /> : null}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session</Text>
        <View style={styles.sectionCard}>
          {sessionItems.map((item, i) => (
            <React.Fragment key={item.label}>
              <SettingRow item={item} />
              {i < sessionItems.length - 1 ? <View style={styles.divider} /> : null}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.sectionCard}>
          {aboutItems.map((item, i) => (
            <React.Fragment key={item.label}>
              <SettingRow item={item} />
              {i < aboutItems.length - 1 ? <View style={styles.divider} /> : null}
            </React.Fragment>
          ))}
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.signOutBtn, pressed && styles.signOutPressed]}
        onPress={() => setShowLogoutModal(true)}
        accessibilityLabel="Sign out"
      >
        <Ionicons name="log-out" size={20} color={Colors.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>

      <View style={styles.footer}>
        <Ionicons name="medkit" size={14} color={Colors.textLight} />
        <Text style={styles.footerText}>Northern Health Link v{APP_VERSION}</Text>
      </View>

      <Text style={styles.sessionInfo}>
        Your session expires after 30 minutes of inactivity
      </Text>

      <View style={{ height: 20 }} />

      <Portal>
        <Modal visible={showLogoutModal} onDismiss={() => setShowLogoutModal(false)} contentContainerStyle={styles.modal}>
          <View style={styles.modalIcon}>
            <Ionicons name="log-out" size={36} color={Colors.error} />
          </View>
          <Text style={styles.modalTitle}>Sign Out?</Text>
          <Text style={styles.modalBody}>You will be returned to the login screen.</Text>
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowLogoutModal(false)} style={styles.modalBtn} accessibilityLabel="Cancel sign out">
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleLogout}
              loading={isLoggingOut}
              disabled={isLoggingOut}
              buttonColor={Colors.error}
              style={styles.modalBtn}
              accessibilityLabel="Sign out"
            >
              Sign Out
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },

  profileHeader: { alignItems: 'center', paddingVertical: Spacing.lg, marginBottom: Spacing.sm },
  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  avatar: { borderWidth: 3, borderColor: Colors.border },
  avatarLabel: { fontWeight: '800', fontSize: 26 },
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
  name: { fontSize: 22, fontWeight: '800', color: Colors.text },
  email: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: Spacing.sm,
  },
  roleText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  userIdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' },
      default: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  userIdLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  userIdIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  userIdLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
  userIdValue: { fontSize: 20, fontWeight: '800', color: Colors.text, letterSpacing: 1, marginTop: 2 },
  copyBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  copyBtnActive: { backgroundColor: Colors.primary },

  section: { marginBottom: Spacing.sm },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  rowPressed: { backgroundColor: Colors.backgroundAlt },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  rowDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: 60 },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.errorLight,
    borderRadius: 16,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  signOutPressed: { opacity: 0.7 },
  signOutText: { fontSize: 16, fontWeight: '700', color: Colors.error },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.xl,
  },
  footerText: { fontSize: 12, color: Colors.textLight, fontWeight: '500' },

  sessionInfo: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontStyle: 'italic',
  },

  modal: { backgroundColor: Colors.surface, padding: Spacing.xl, margin: Spacing.lg, borderRadius: 20, alignItems: 'center' },
  modalIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.errorLight, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  modalBody: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg, width: '100%' },
  modalBtn: { flex: 1, borderRadius: 12 },
})
