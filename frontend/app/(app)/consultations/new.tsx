import { useState } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { Text, TextInput, Button, SegmentedButtons } from 'react-native-paper'
import { Screen, PageHeader } from '../../../src/components'
import { useAuth } from '../../../src/features/auth'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import { clinicalApi } from '../../../src/core/api'
import { router, useLocalSearchParams } from 'expo-router'
import { getApiErrorMessage } from '../../../src/utils/apiError'
import { ImageUpload } from '../../../src/components/ui/ImageUpload'

type NoteType = 'INITIAL' | 'FOLLOW_UP' | 'REFERRAL'

export default function NewConsultationScreen() {
  const { hasRole } = useAuth()
  const qc = useQueryClient()
  const params = useLocalSearchParams<{ appointment_id?: string }>()

  const [appointmentId, setAppointmentId] = useState(params.appointment_id || '')
  const [noteType, setNoteType] = useState<NoteType>('INITIAL')
  const [diagnosis, setDiagnosis] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [treatmentInstructions, setTreatmentInstructions] = useState('')
  const [referralNotes, setReferralNotes] = useState('')
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      clinicalApi.createConsultationNote({
        appointment_id: Number(appointmentId),
        diagnosis: diagnosis.trim(),
        recommendations: recommendations.trim() || undefined,
        treatment_instructions: treatmentInstructions.trim() || undefined,
        referral_notes: referralNotes.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultations'] })
      qc.invalidateQueries({ queryKey: ['appointments'] })
      Alert.alert('Success', 'Consultation note created', [{ text: 'OK', onPress: () => router.back() }])
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  if (!hasRole('SPECIALIST', 'CLINIC_STAFF', 'ADMIN')) {
    return (
      <Screen>
        <PageHeader title="New Consultation Note" />
        <Text style={styles.accessDenied}>You do not have permission to create consultation notes.</Text>
      </Screen>
    )
  }

  return (
    <Screen scroll={false}>
      <PageHeader title="New Consultation Note" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.heroIcon}>
            <View style={styles.heroCircle}>
              <Ionicons name="document-text" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.heroTitle}>New Consultation Note</Text>
            <Text style={styles.heroSubtitle}>Record your clinical observations</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Appointment</Text>
            <TextInput
              label="Appointment ID"
              value={appointmentId}
              onChangeText={setAppointmentId}
              keyboardType="numeric"
              mode="outlined"
              left={<TextInput.Icon icon="calendar" color={Colors.primaryLight} />}
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 10 }}
            />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Note Type</Text>
            <SegmentedButtons
              value={noteType}
              onValueChange={(v) => setNoteType(v as NoteType)}
              buttons={[
                { value: 'INITIAL', label: 'Initial', icon: 'document' },
                { value: 'FOLLOW_UP', label: 'Follow-up', icon: 'refresh' },
                { value: 'REFERRAL', label: 'Referral', icon: 'swap-horizontal' },
              ]}
              style={styles.segmented}
              theme={{ roundness: 10 }}
            />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Clinical Information</Text>
            <TextInput
              label="Diagnosis *"
              value={diagnosis}
              onChangeText={setDiagnosis}
              mode="outlined"
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="stethoscope" color={Colors.primaryLight} />}
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 10 }}
            />
            <TextInput
              label="Symptoms"
              value={symptoms}
              onChangeText={setSymptoms}
              mode="outlined"
              multiline
              numberOfLines={2}
              left={<TextInput.Icon icon="thermometer" color="#FF8C00" />}
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 10 }}
            />
            <TextInput
              label="Treatment Instructions"
              value={treatmentInstructions}
              onChangeText={setTreatmentInstructions}
              mode="outlined"
              multiline
              numberOfLines={2}
              left={<TextInput.Icon icon="medkit" color="#4CAF50" />}
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 10 }}
            />
            <TextInput
              label="Recommendations"
              value={recommendations}
              onChangeText={setRecommendations}
              mode="outlined"
              multiline
              numberOfLines={2}
              left={<TextInput.Icon icon="bulb" color="#FFC107" />}
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 10 }}
            />
          </View>

          {noteType === 'REFERRAL' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Referral Details</Text>
              <TextInput
                label="Referral Notes"
                value={referralNotes}
                onChangeText={setReferralNotes}
                mode="outlined"
                multiline
                numberOfLines={3}
                left={<TextInput.Icon icon="people" color="#17A2B8" />}
                style={styles.input}
                outlineColor={Colors.border}
                activeOutlineColor={Colors.primary}
                theme={{ roundness: 10 }}
              />
            </View>
          )}

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            <ImageUpload
              label="Consultation Image (optional)"
              imageUri={photoUri}
              onImageSelected={(uri) => setPhotoUri(uri)}
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <Button
            mode="contained"
            buttonColor={Colors.primary}
            loading={mutation.isPending}
            disabled={mutation.isPending || !diagnosis.trim() || !appointmentId.trim()}
            onPress={() => { setError(''); mutation.mutate() }}
            icon="checkmark-circle"
            style={styles.submitBtn}
          >
            Submit Note
          </Button>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.md },
  accessDenied: { color: Colors.error, textAlign: 'center', marginTop: Spacing.xl, fontWeight: '600' },

  heroIcon: { alignItems: 'center', paddingVertical: Spacing.lg, marginBottom: Spacing.md },
  heroCircle: { width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.primary + '12', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  heroTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  heroSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  sectionCard: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.sm, paddingHorizontal: 4 },
  segmented: { marginBottom: Spacing.sm },

  input: { marginBottom: Spacing.sm, backgroundColor: Colors.backgroundAlt },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.errorLight, padding: Spacing.md, borderRadius: 12, marginBottom: Spacing.md },
  error: { color: Colors.error, fontSize: 13, fontWeight: '600', flex: 1 },

  submitBtn: { borderRadius: 12 },
})
