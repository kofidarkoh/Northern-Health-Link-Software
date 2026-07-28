import React, { useState } from 'react'
import { StyleSheet, View, ScrollView } from 'react-native'
import { Text, TextInput, Button } from 'react-native-paper'
import { Screen, PageHeader } from '../../../src/components'
import { clinicalApi } from '../../../src/core/api'
import { useAuth } from '../../../src/features/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import { router, useLocalSearchParams } from 'expo-router'
import { getApiErrorMessage } from '../../../src/utils/apiError'

export default function ConsultationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { hasRole } = useAuth()
  const qc = useQueryClient()
  const appointmentId = Number(id)

  const [diagnosis, setDiagnosis] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [referralNotes, setReferralNotes] = useState('')
  const [treatmentInstructions, setTreatmentInstructions] = useState('')
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => clinicalApi.getAppointment(appointmentId),
    enabled: appointmentId > 0,
  })

  const noteMutation = useMutation({
    mutationFn: () =>
      clinicalApi.createConsultationNote({
        appointment_id: appointmentId,
        diagnosis: diagnosis.trim(),
        recommendations: recommendations.trim() || undefined,
        referral_notes: referralNotes.trim() || undefined,
        treatment_instructions: treatmentInstructions.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointment', appointmentId] })
      qc.invalidateQueries({ queryKey: ['consultations'] })
      setShowForm(false)
      setDiagnosis(''); setRecommendations(''); setReferralNotes(''); setTreatmentInstructions('')
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  })

  const appointment = data?.appointment
  const isSpecialist = hasRole('SPECIALIST')

  if (isLoading) return <Screen><PageHeader title="Consultation" /><Text style={styles.loading}>Loading...</Text></Screen>
  if (error || !appointment) return <Screen><PageHeader title="Consultation" /><Text style={styles.errorText}>{error ? getApiErrorMessage(error) : 'Not found'}</Text></Screen>

  return (
    <Screen>
      <PageHeader title="Consultation Details" />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <View style={[styles.statusIcon, { backgroundColor: '#17A2B8' + '15' }]}>
            <Ionicons name="chatbubbles" size={28} color="#17A2B8" />
          </View>
          <Text style={styles.title}>Appointment #{appointment.id}</Text>
          <Text style={styles.subtitle}>Patient #{appointment.patient_id}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.sectionCard}>
            {[
              { icon: 'person', label: 'Patient', value: `#${appointment.patient_id}`, color: '#DC3545' },
              { icon: 'medical', label: 'Specialist', value: `#${appointment.specialist_id}`, color: '#2D3E18' },
              { icon: 'business', label: 'Clinic', value: `#${appointment.clinic_id}`, color: '#17A2B8' },
              { icon: 'time', label: 'Scheduled', value: new Date(appointment.appointment_time).toLocaleString(), color: '#FF8C00' },
            ].map((row, i, arr) => (
              <React.Fragment key={row.label}>
                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: row.color + '12' }]}>
                    <Ionicons name={row.icon as any} size={18} color={row.color} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{row.label}</Text>
                    <Text style={styles.infoValue}>{row.value}</Text>
                  </View>
                </View>
                {i < arr.length - 1 ? <View style={styles.divider} /> : null}
              </React.Fragment>
            ))}
          </View>
        </View>

        {isSpecialist && appointment.status !== 'COMPLETED' && (
          <>
            {!showForm ? (
              <Button mode="contained" buttonColor={Colors.primary} onPress={() => setShowForm(true)} icon="document-text" style={styles.recordBtn}>
                Record Consultation Note
              </Button>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Consultation Note</Text>
                <View style={styles.sectionCard}>
                  <TextInput label="Diagnosis *" value={diagnosis} onChangeText={setDiagnosis} mode="outlined" multiline numberOfLines={3} left={<TextInput.Icon icon="stethoscope" color={Colors.primaryLight} />} style={styles.input} outlineColor={Colors.border} activeOutlineColor={Colors.primary} theme={{ roundness: 10 }} />
                  <TextInput label="Recommendations" value={recommendations} onChangeText={setRecommendations} mode="outlined" multiline numberOfLines={2} style={styles.input} outlineColor={Colors.border} activeOutlineColor={Colors.primary} theme={{ roundness: 10 }} />
                  <TextInput label="Referral Notes" value={referralNotes} onChangeText={setReferralNotes} mode="outlined" multiline numberOfLines={2} style={styles.input} outlineColor={Colors.border} activeOutlineColor={Colors.primary} theme={{ roundness: 10 }} />
                  <TextInput label="Treatment Instructions" value={treatmentInstructions} onChangeText={setTreatmentInstructions} mode="outlined" multiline numberOfLines={2} style={styles.input} outlineColor={Colors.border} activeOutlineColor={Colors.primary} theme={{ roundness: 10 }} />

                  {formError ? (
                    <View style={styles.errorBox}>
                      <Ionicons name="alert-circle" size={16} color={Colors.error} />
                      <Text style={styles.error}>{formError}</Text>
                    </View>
                  ) : null}

                  <View style={styles.formActions}>
                    <Button mode="outlined" onPress={() => { setShowForm(false); setFormError('') }} style={styles.formBtn}>Cancel</Button>
                    <Button mode="contained" buttonColor={Colors.primary} loading={noteMutation.isPending} disabled={noteMutation.isPending || !diagnosis.trim()} onPress={() => { setFormError(''); noteMutation.mutate() }} style={styles.formBtn}>
                      Submit Note
                    </Button>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xl },
  errorText: { color: Colors.error, textAlign: 'center', marginTop: Spacing.xl },
  infoCard: { alignItems: 'center', paddingVertical: Spacing.lg, marginBottom: Spacing.sm },
  statusIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },

  section: { marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.xs, paddingHorizontal: 4 },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },

  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.md },
  infoIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue: { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: 52 },

  recordBtn: { borderRadius: 12, marginTop: Spacing.sm },
  input: { marginBottom: Spacing.md, backgroundColor: Colors.backgroundAlt },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.errorLight, padding: Spacing.md, borderRadius: 12, marginBottom: Spacing.md },
  error: { color: Colors.error, fontSize: 13, fontWeight: '600', flex: 1 },
  formActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  formBtn: { flex: 1, borderRadius: 12 },
})
