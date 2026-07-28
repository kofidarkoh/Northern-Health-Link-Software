import React, { useState } from 'react'
import { StyleSheet, View, ScrollView, RefreshControl, Platform, Pressable } from 'react-native'
import { Text, TextInput, Button, FAB, Portal, Modal } from 'react-native-paper'
import { Screen, PageHeader } from '../../../src/components'
import { adminApi } from '../../../src/core/api/adminApi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import { SkeletonList } from '../../../src/components/ui/Skeleton'
import { getApiErrorMessage } from '../../../src/utils/apiError'
import type { Clinic } from '../../../src/types'

export default function ClinicsScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newClinic, setNewClinic] = useState({ name: '', district: '', contact_phone: '' })
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-clinics'],
    queryFn: () => adminApi.listClinics(),
  })

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => adminApi.createClinic(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] })
      setShowCreateModal(false)
      setNewClinic({ name: '', district: '', contact_phone: '' })
      setError('')
    },
    onError: (err: unknown) => setError(getApiErrorMessage(err, 'Failed to create clinic')),
  })

  const clinics = data?.clinics || []
  const filtered = clinics.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.district.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const districts = [...new Set(clinics.map(c => c.district))]

  if (isLoading) {
    return (
      <Screen>
        <PageHeader title="Clinics" showBack={false} />
        <View style={{ padding: Spacing.md }}>
          <SkeletonList count={5} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <PageHeader title="Clinics" subtitle="Northern District Medical Centers" showBack={false} />

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#17A2B8' + '15' }]}>
              <Ionicons name="business" size={20} color="#17A2B8" />
            </View>
            <Text style={styles.statValue}>{clinics.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#2D3E18' + '15' }]}>
              <Ionicons name="location" size={20} color="#2D3E18" />
            </View>
            <Text style={styles.statValue}>{districts.length}</Text>
            <Text style={styles.statLabel}>Districts</Text>
          </View>
        </View>

        <View style={styles.filters}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={Colors.textLight} />
            <TextInput
              placeholder="Search clinics or districts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              mode="flat"
              style={styles.searchInput}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              contentStyle={{ minHeight: 0, paddingVertical: 0 }}
              theme={{ roundness: 8 }}
            />
          </View>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="business-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No clinics found</Text>
            <Text style={styles.emptyHint}>Add a medical center to get started</Text>
          </View>
        ) : (
          filtered.map(clinic => (
            <View key={clinic.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="business" size={22} color={Colors.white} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>{clinic.name}</Text>
                <View style={styles.cardMeta}>
                  <View style={styles.districtBadge}>
                    <Ionicons name="location" size={12} color="#17A2B8" />
                    <Text style={styles.districtText}>{clinic.district}</Text>
                  </View>
                  {clinic.contact_phone ? (
                    <View style={styles.phoneBadge}>
                      <Ionicons name="call" size={12} color="#6F42C1" />
                      <Text style={styles.phoneText}>{clinic.contact_phone}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB
        icon="plus"
        label="Add Clinic"
        style={styles.fab}
        onPress={() => { setShowCreateModal(true); setError('') }}
      />

      <Portal>
        <Modal visible={showCreateModal} onDismiss={() => setShowCreateModal(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>New Medical Center</Text>

          <TextInput
            label="Clinic Name"
            value={newClinic.name}
            onChangeText={v => setNewClinic({ ...newClinic, name: v })}
            mode="outlined"
            left={<TextInput.Icon icon="office-building" color={Colors.primaryLight} />}
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            theme={{ roundness: 10 }}
          />

          <TextInput
            label="District"
            value={newClinic.district}
            onChangeText={v => setNewClinic({ ...newClinic, district: v })}
            mode="outlined"
            left={<TextInput.Icon icon="map-marker-outline" color={Colors.primaryLight} />}
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            theme={{ roundness: 10 }}
          />

          <TextInput
            label="Contact Phone"
            value={newClinic.contact_phone}
            onChangeText={v => setNewClinic({ ...newClinic, contact_phone: v })}
            mode="outlined"
            keyboardType="phone-pad"
            left={<TextInput.Icon icon="phone-outline" color={Colors.primaryLight} />}
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            theme={{ roundness: 10 }}
          />

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowCreateModal(false)} style={styles.modalBtn}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                if (!newClinic.name.trim() || !newClinic.district.trim()) {
                  setError('Name and district are required')
                  return
                }
                createMutation.mutate(newClinic)
              }}
              loading={createMutation.isPending}
              disabled={createMutation.isPending}
              buttonColor={Colors.primary}
              style={styles.modalBtn}
            >
              Create Clinic
            </Button>
          </View>
        </Modal>
      </Portal>
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
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },

  filters: { marginBottom: Spacing.md },
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
  },
  searchInput: { flex: 1, backgroundColor: 'transparent', fontSize: 14 },

  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  emptyHint: { fontSize: 13, color: Colors.textLight },

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
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#17A2B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardMeta: { flexDirection: 'row', gap: Spacing.sm, marginTop: 6, flexWrap: 'wrap' },
  districtBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#17A2B8' + '12', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  districtText: { fontSize: 11, fontWeight: '600', color: '#17A2B8' },
  phoneBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#6F42C1' + '12', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  phoneText: { fontSize: 11, fontWeight: '600', color: '#6F42C1' },

  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, backgroundColor: Colors.primary },

  modal: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    margin: Spacing.lg,
    borderRadius: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: Spacing.lg },
  input: { marginBottom: Spacing.md, backgroundColor: Colors.backgroundAlt },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.errorLight, padding: Spacing.md, borderRadius: 12, marginBottom: Spacing.md },
  errorText: { color: Colors.error, fontSize: 13, fontWeight: '600', flex: 1 },

  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  modalBtn: { flex: 1, borderRadius: 12 },
})
