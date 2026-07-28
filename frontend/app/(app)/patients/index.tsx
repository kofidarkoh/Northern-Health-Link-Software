import React, { useState } from 'react'
import { StyleSheet, View, ScrollView, RefreshControl, Platform } from 'react-native'
import { Text, FAB, Chip, TextInput } from 'react-native-paper'
import { Screen, PageHeader } from '../../../src/components'
import { patientsApi } from '../../../src/core/api'
import { useAuth } from '../../../src/features/auth'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import { SkeletonList } from '../../../src/components/ui/Skeleton'
import { router } from 'expo-router'
import type { Patient } from '../../../src/types'

const GENDER_COLORS: Record<string, string> = {
  Male: '#17A2B8',
  Female: '#DC3545',
  Other: '#6F42C1',
}

export default function PatientsScreen() {
  const { hasRole } = useAuth()
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const canEdit = hasRole('CLINIC_STAFF', 'ADMIN')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['patients', search, genderFilter],
    queryFn: () => patientsApi.list({
      search: search || undefined,
      gender: genderFilter || undefined,
      per_page: 50,
    }),
  })

  const patients = data?.patients || []
  const filtered = patients

  const maleCount = patients.filter(p => p.gender === 'Male').length
  const femaleCount = patients.filter(p => p.gender === 'Female').length

  if (isLoading) {
    return (
      <Screen>
        <PageHeader title="Patients" showBack={false} />
        <View style={{ padding: Spacing.md }}>
          <SkeletonList count={5} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <PageHeader title="Patients" subtitle={`${data?.total ?? 0} Records`} showBack={false} />

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primary + '15' }]}>
              <Ionicons name="people" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{data?.total ?? 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#17A2B8' + '15' }]}>
              <Ionicons name="male" size={20} color="#17A2B8" />
            </View>
            <Text style={styles.statValue}>{maleCount}</Text>
            <Text style={styles.statLabel}>Male</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#DC3545' + '15' }]}>
              <Ionicons name="female" size={20} color="#DC3545" />
            </View>
            <Text style={styles.statValue}>{femaleCount}</Text>
            <Text style={styles.statLabel}>Female</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={Colors.textLight} />
          <TextInput
            placeholder="Search name, phone, district..."
            value={search}
            onChangeText={setSearch}
            mode="flat"
            style={styles.searchInput}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            contentStyle={{ minHeight: 0, paddingVertical: 0 }}
            theme={{ roundness: 8 }}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {[{ label: 'All', value: '' }, { label: 'Male', value: 'Male' }, { label: 'Female', value: 'Female' }].map(g => (
            <Chip
              key={g.value}
              selected={genderFilter === g.value}
              onPress={() => setGenderFilter(g.value)}
              style={styles.chip}
              selectedColor={g.value ? GENDER_COLORS[g.value] : Colors.primary}
              showSelectedOverlay
            >
              {g.label}
            </Chip>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No patients found</Text>
          </View>
        ) : (
          filtered.map(patient => {
            const initials = patient.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            const genderColor = GENDER_COLORS[patient.gender] || Colors.textSecondary
            return (
              <View
                key={patient.id}
                style={styles.card}
              >
                <View style={[styles.avatar, { backgroundColor: genderColor + '15' }]}>
                  <Text style={[styles.avatarText, { color: genderColor }]}>{initials}</Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{patient.full_name}</Text>
                    <Text style={styles.cardId}>#{patient.id}</Text>
                  </View>
                  <View style={styles.cardMeta}>
                    <View style={[styles.badge, { backgroundColor: genderColor + '12' }]}>
                      <Text style={[styles.badgeText, { color: genderColor }]}>{patient.gender}</Text>
                    </View>
                    {patient.age ? (
                      <View style={[styles.badge, { backgroundColor: Colors.primary + '12' }]}>
                        <Text style={[styles.badgeText, { color: Colors.primary }]}>{patient.age}y</Text>
                      </View>
                    ) : null}
                    <View style={[styles.badge, { backgroundColor: '#17A2B8' + '12' }]}>
                      <Ionicons name="location" size={10} color="#17A2B8" />
                      <Text style={[styles.badgeText, { color: '#17A2B8' }]}>{patient.district}</Text>
                    </View>
                  </View>
                  {patient.contact_phone ? (
                    <View style={styles.phoneRow}>
                      <Ionicons name="call" size={12} color={Colors.textSecondary} />
                      <Text style={styles.phoneText}>{patient.contact_phone}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {canEdit && (
        <FAB
          icon="plus"
          label="Register"
          style={styles.fab}
          onPress={() => router.push('/(app)/patients/new')}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInput: { flex: 1, backgroundColor: 'transparent', fontSize: 14 },

  chipScroll: { marginBottom: Spacing.md },
  chip: { marginRight: Spacing.xs },

  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, flexShrink: 1 },
  cardId: { fontSize: 12, color: Colors.textLight, fontWeight: '500' },
  cardMeta: { flexDirection: 'row', gap: Spacing.xs, marginTop: 6, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  phoneText: { fontSize: 12, color: Colors.textSecondary },

  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, backgroundColor: Colors.primary },
})
