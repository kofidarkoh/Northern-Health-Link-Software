import { useState, useCallback } from 'react'
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native'
import { Text, TextInput, Button, FAB, Portal, Modal } from 'react-native-paper'
import { Screen, PageHeader } from '../../../src/components'
import { prescriptionsApi, patientsApi } from '../../../src/core/api'
import { useAuth } from '../../../src/features/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import { SkeletonList } from '../../../src/components/ui/Skeleton'
import { getApiErrorMessage } from '../../../src/utils/apiError'
import { useFormValidation, required } from '../../../src/hooks/useFormValidation'


export default function PrescriptionsScreen() {
  const { hasRole } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const isSpecialist = hasRole('SPECIALIST')

  const [patientId, setPatientId] = useState('')
  const [medicationName, setMedicationName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [duration, setDuration] = useState('')
  const [instructions, setInstructions] = useState('')
  const [formError, setFormError] = useState('')

  const { validate, getFieldError, clearFieldError } = useFormValidation(
    {
      medicationName: required('Medication name'),
      dosage: required('Dosage'),
    },
    null,
  )

  const numericPatientId = Number(patientId)
  const { data: patientData, isLoading: isLoadingPatient } = useQuery({
    queryKey: ['patient-verify', numericPatientId],
    queryFn: () => patientsApi.get(numericPatientId),
    enabled: modalVisible && Number.isFinite(numericPatientId) && numericPatientId > 0,
    retry: false,
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['prescriptions', search],
    queryFn: () => prescriptionsApi.list({ patient_id: search || undefined }),
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const mutation = useMutation({
    mutationFn: () =>
      prescriptionsApi.create({
        patient_id: numericPatientId,
        medication_name: medicationName.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim() || undefined,
        duration: duration.trim() || undefined,
        instructions: instructions.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prescriptions'] })
      setModalVisible(false)
      setPatientId(''); setMedicationName(''); setDosage('')
      setFrequency(''); setDuration(''); setInstructions(''); setFormError('')
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  })

  const prescriptions = data?.prescriptions || []

  if (isLoading) {
    return (
      <Screen>
        <PageHeader title="Prescriptions" showBack={false} />
        <View style={{ padding: Spacing.md }}>
          <SkeletonList count={5} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <PageHeader title="Prescriptions" subtitle="Patient Medication Orders" showBack={false} />

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
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primary + '15' }]}>
              <Ionicons name="medical" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{prescriptions.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={Colors.textLight} />
          <TextInput
            placeholder="Filter by Patient ID..."
            value={search}
            onChangeText={setSearch}
            mode="flat"
            keyboardType="number-pad"
            style={styles.searchInput}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            contentStyle={{ minHeight: 0, paddingVertical: 0 }}
            theme={{ roundness: 8 }}
          />
        </View>

        {prescriptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="medkit-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No prescriptions yet</Text>
            <Text style={styles.emptySubtitle}>Create your first prescription to get started</Text>
            <Button mode="contained" onPress={() => { setModalVisible(true); setFormError('') }} style={{ marginTop: 16, backgroundColor: Colors.primary }}>
              Create Prescription
            </Button>
          </View>
        ) : (
          prescriptions.map(rx => (
            <View key={rx.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="medical" size={20} color={Colors.white} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{rx.medication_name}</Text>
                  <Text style={styles.cardId}>#{rx.id}</Text>
                </View>
                <View style={styles.dosageRow}>
                  <View style={styles.dosageBadge}>
                    <Text style={styles.dosageText}>{rx.dosage}</Text>
                  </View>
                  {rx.frequency ? (
                    <View style={[styles.dosageBadge, { backgroundColor: '#17A2B8' + '12' }]}>
                      <Text style={[styles.dosageText, { color: '#17A2B8' }]}>{rx.frequency}</Text>
                    </View>
                  ) : null}
                  {rx.duration ? (
                    <View style={[styles.dosageBadge, { backgroundColor: '#FFC107' + '12' }]}>
                      <Text style={[styles.dosageText, { color: '#FF8C00' }]}>{rx.duration}</Text>
                    </View>
                  ) : null}
                </View>
                {rx.instructions ? (
                  <Text style={styles.instructions} numberOfLines={1}>Note: {rx.instructions}</Text>
                ) : null}
                <Text style={styles.patient}>Patient #{rx.patient_id}</Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {isSpecialist && (
        <FAB
          icon="plus"
          label="Prescribe"
          style={styles.fab}
          onPress={() => { setModalVisible(true); setFormError('') }}
        />
      )}

      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>New Prescription</Text>

          <TextInput
            label="Patient ID *"
            value={patientId}
            onChangeText={setPatientId}
            keyboardType="number-pad"
            mode="outlined"
            left={<TextInput.Icon icon="account-outline" color={Colors.primaryLight} />}
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            theme={{ roundness: 10 }}
          />
          {isLoadingPatient ? (
            <Text style={styles.verify}>Verifying patient...</Text>
          ) : patientData ? (
            <Text style={styles.verified}>Patient: {patientData.full_name}</Text>
          ) : patientId ? (
            <Text style={styles.notFound}>Patient not found</Text>
          ) : null}

          <TextInput
            label="Medication Name *"
            value={medicationName}
            onChangeText={(text) => { setMedicationName(text); clearFieldError('medicationName') }}
            mode="outlined"
            error={!!getFieldError('medicationName')}
            left={<TextInput.Icon icon="medkit" color={Colors.primaryLight} />}
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            theme={{ roundness: 10 }}
          />
          {getFieldError('medicationName') ? (
            <Text style={{ color: '#DC3545', fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4 }}>{getFieldError('medicationName')}</Text>
          ) : null}

          <TextInput
            label="Dosage *"
            placeholder="e.g. 500mg"
            value={dosage}
            onChangeText={(text) => { setDosage(text); clearFieldError('dosage') }}
            mode="outlined"
            error={!!getFieldError('dosage')}
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            theme={{ roundness: 10 }}
          />
          {getFieldError('dosage') ? (
            <Text style={{ color: '#DC3545', fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4 }}>{getFieldError('dosage')}</Text>
          ) : null}

          <View style={styles.formRow}>
            <TextInput
              label="Frequency"
              placeholder="e.g. Twice daily"
              value={frequency}
              onChangeText={setFrequency}
              mode="outlined"
              style={[styles.input, { flex: 1 }]}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 10 }}
            />
            <TextInput
              label="Duration"
              placeholder="e.g. 5 days"
              value={duration}
              onChangeText={setDuration}
              mode="outlined"
              style={[styles.input, { flex: 1 }]}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 10 }}
            />
          </View>

          <TextInput
            label="Instructions"
            placeholder="e.g. Take after meals"
            value={instructions}
            onChangeText={setInstructions}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            theme={{ roundness: 10 }}
          />

          {formError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          ) : null}

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.modalBtn}>Cancel</Button>
            <Button
              mode="contained"
              onPress={() => {
                setFormError('')
                if (!validate({ medicationName, dosage })) return
                if (!patientData) return
                mutation.mutate()
              }}
              loading={mutation.isPending}
              disabled={mutation.isPending || !patientData || !medicationName.trim() || !dosage.trim()}
              buttonColor={Colors.primary}
              style={styles.modalBtn}
            >
              Save
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
    marginBottom: Spacing.md,
  },
  searchInput: { flex: 1, backgroundColor: 'transparent', fontSize: 14 },

  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },

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
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, flexShrink: 1 },
  cardId: { fontSize: 12, color: Colors.textLight, fontWeight: '500' },
  dosageRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: 6, flexWrap: 'wrap' },
  dosageBadge: { backgroundColor: Colors.primary + '12', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  dosageText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  instructions: { fontSize: 12, color: Colors.textSecondary, marginTop: 6, fontStyle: 'italic' },
  patient: { fontSize: 11, color: Colors.textLight, marginTop: 4 },

  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, backgroundColor: Colors.primary },

  modal: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    margin: Spacing.lg,
    borderRadius: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: Spacing.lg },
  input: { marginBottom: Spacing.md, backgroundColor: Colors.backgroundAlt },
  formRow: { flexDirection: 'row', gap: Spacing.sm },
  verify: { fontSize: 12, color: Colors.textLight, marginBottom: Spacing.sm, marginLeft: 4 },
  verified: { fontSize: 12, color: Colors.primary, marginBottom: Spacing.sm, marginLeft: 4, fontWeight: '600' },
  notFound: { fontSize: 12, color: Colors.error, marginBottom: Spacing.sm, marginLeft: 4 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.errorLight, padding: Spacing.md, borderRadius: 12, marginBottom: Spacing.md },
  errorText: { color: Colors.error, fontSize: 13, fontWeight: '600', flex: 1 },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  modalBtn: { flex: 1, borderRadius: 12 },
})
