import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Text, Avatar } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../constants'
import type { User } from '../../types'

interface SpecialistCardProps {
  specialist: User
  onPress?: () => void
  selected?: boolean
}

export function SpecialistCard({ specialist, onPress, selected }: SpecialistCardProps) {
  const initials = specialist.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Pressable
      style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.avatarWrap}>
        <Avatar.Text size={56} label={initials} style={styles.avatar} labelStyle={styles.avatarLabel} />
        <View style={styles.statusDot} />
      </View>
      <View style={styles.info}>
        <Text variant="titleSmall" style={styles.name} numberOfLines={1}>{specialist.full_name}</Text>
        <Text variant="bodySmall" style={styles.specialty}>
          {specialist.speciality || 'General Medicine'}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="medkit" size={12} color={Colors.textSecondary} />
          <Text variant="bodySmall" style={styles.metaText}>ID: #{specialist.id}</Text>
        </View>
      </View>
      {selected && (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
        </View>
      )}
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
    borderWidth: 2,
    borderColor: Colors.border,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
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
    backgroundColor: Colors.primary,
  },
  avatarLabel: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 18,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: '700',
    color: Colors.text,
  },
  specialty: {
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  checkmark: {
    marginLeft: Spacing.sm,
  },
})
