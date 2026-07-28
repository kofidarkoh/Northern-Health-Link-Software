import { View, StyleSheet, Pressable } from 'react-native'
import { Text, Avatar } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../constants'
import type { User, UserRole } from '../../types'

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

interface UserCardProps {
  user: User
  onPress?: () => void
}

export function UserCard({ user, onPress }: UserCardProps) {
  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const roleColor = ROLE_COLORS[user.role] || Colors.textSecondary
  const roleIcon = ROLE_ICONS[user.role] || 'person'

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.avatarWrap}>
        <Avatar.Text
          size={52}
          label={initials}
          style={[styles.avatar, { backgroundColor: roleColor + '15' }]}
          labelStyle={[styles.avatarLabel, { color: roleColor }]}
        />
        <View style={[styles.statusDot, { backgroundColor: user.active ? '#4CAF50' : Colors.textLight }]} />
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text variant="titleSmall" style={styles.name} numberOfLines={1}>{user.full_name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: user.active ? Colors.successLight : Colors.backgroundAlt }]}>
            <Text style={[styles.statusText, { color: user.active ? Colors.primary : Colors.textLight }]}>
              {user.active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={styles.idRow}>
          <Text variant="bodySmall" style={styles.userId} numberOfLines={1}>{user.user_id}</Text>
          {user.email ? (
            <Text variant="bodySmall" style={styles.email} numberOfLines={1}>{user.email}</Text>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + '15' }]}>
            <Ionicons name={roleIcon as any} size={12} color={roleColor} />
            <Text style={[styles.roleText, { color: roleColor }]}>
              {user.role.replace('_', ' ')}
            </Text>
          </View>
          {user.speciality ? (
            <Text variant="bodySmall" style={styles.specialty} numberOfLines={1}>
              {user.speciality}
            </Text>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  avatarWrap: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    borderWidth: 2,
    borderColor: Colors.border,
  },
  avatarLabel: {
    fontWeight: '800',
    fontSize: 17,
  },
  statusDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  name: {
    fontWeight: '700',
    color: Colors.text,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  email: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  userId: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  specialty: {
    color: Colors.textSecondary,
    fontSize: 12,
    flexShrink: 1,
  },
})
