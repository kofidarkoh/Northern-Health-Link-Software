import { useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TextInput, Button, Text, Chip } from 'react-native-paper'
import { Screen, PageHeader } from '../../../src/components'
import { SpecialistCard } from '../../../src/components/ui/SpecialistCard'
import { CalendarPicker } from '../../../src/components/ui/CalendarPicker'
import { clinicalApi, patientsApi } from '../../../src/core/api'
import { useAuth } from '../../../src/features/auth'
import { getApiErrorMessage } from '../../../src/utils/apiError'
import { Colors, Spacing } from '../../../src/constants'
import type { User } from '../../../src/types'

const SPECIALTIES = ['All', 'General Medicine', 'Cardiology', 'Pediatrics', 'Dermatology', 'Orthopedics', 'ENT']

export default function NewAppointmentScreen() {
  const { user, hasRole } = useAuth()
  const qc = useQueryClient()

  const [patientId, setPatientId] = useState('')
  const [selectedSpecialist, setSelectedSpecialist] = useState<User | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [activeSpecialty, setActiveSpecialty] = useState('All')

  const numericPatientId = Number(patientId)
  const { data: patientData, isLoading: isLoadingPatient } = useQuery({
    queryKey: ['patient-verify', numericPatientId],
    queryFn: () => patientsApi.get(numericPatientId),
    enabled: Number.isFinite(numericPatientId) && numericPatientId > 0,
    retry: false,
  })

  const { data: specialistData, isLoading: isLoadingSpecialists } = useQuery({
    queryKey: ['specialists', activeSpecialty],
    queryFn: () =>
      clinicalApi.listSpecialists({
        speciality: activeSpecialty === 'All' ? undefined : activeSpecialty,
      }),
  })

  const specialists = specialistData?.specialists ?? []

  const mutation = useMutation({
    mutationFn: () =>
      clinicalApi.createAppointment({
        patient_id: numericPatientId,
        specialist_id: selectedSpecialist?.id,
        clinic_id: user?.clinic_id,
        appointment_time: selectedDate && selectedTime ? `${selectedDate}T${selectedTime}:00` : undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      router.replace({
        pathname: '/(app)/appointments/confirm',
        params: {
          appointmentId: String(res.appointment.id),
          patientName: patientData?.full_name || `Patient #${patientId}`,
          specialistName: selectedSpecialist?.full_name || 'Any Available',
          specialty: selectedSpecialist?.speciality || 'General Medicine',
          date: selectedDate,
          time: selectedTime,
        },
      })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  if (!hasRole('CLINIC_STAFF', 'ADMIN')) {
    return (
      <Screen>
        <PageHeader title="Schedule Appointment" />
        <Text style={styles.error}>Access denied</Text>
      </Screen>
    )
  }

  return (
    <Screen>
      <PageHeader title="Schedule Appointment" subtitle="Book a specialist consultation" />
      <ScrollView contentContainerStyle={styles.form}>
        <TextInput
          label="Patient ID *"
          value={patientId}
          onChangeText={setPatientId}
          keyboardType="number-pad"
          mode="outlined"
          style={styles.input}
          theme={{ roundness: 12 }}
        />
        {isLoadingPatient ? (
          <Text style={styles.info}>Verifying patient ID...</Text>
        ) : patientData ? (
          <Text style={styles.success}>Patient found: {patientData.full_name} ({patientData.district})</Text>
        ) : patientId ? (
          <Text style={styles.warning}>Patient not found</Text>
        ) : null}

        <Text variant="titleSmall" style={styles.sectionLabel}>Select Specialist</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {SPECIALTIES.map((s) => (
            <Chip
              key={s}
              selected={activeSpecialty === s}
              onPress={() => setActiveSpecialty(s)}
              style={[styles.chip, activeSpecialty === s && styles.chipSelected]}
              textStyle={activeSpecialty === s ? styles.chipTextSelected : undefined}
              compact
            >
              {s}
            </Chip>
          ))}
        </ScrollView>

        {isLoadingSpecialists ? (
          <Text style={styles.info}>Loading specialists...</Text>
        ) : (
          <View style={styles.specialistList}>
            {specialists.map((s) => (
              <SpecialistCard
                key={s.id}
                specialist={s}
                selected={selectedSpecialist?.id === s.id}
                onPress={() => setSelectedSpecialist(selectedSpecialist?.id === s.id ? null : s)}
              />
            ))}
            {specialists.length === 0 && (
              <Text style={styles.info}>No specialists found for this specialty.</Text>
            )}
          </View>
        )}

        <Text variant="titleSmall" style={styles.sectionLabel}>Select Date & Time</Text>
        <CalendarPicker
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onDateChange={setSelectedDate}
          onTimeChange={setSelectedTime}
        />

        <TextInput
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          numberOfLines={3}
          placeholder="Additional notes for the specialist..."
          style={styles.input}
          theme={{ roundness: 12 }}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          mode="contained"
          buttonColor={Colors.primary}
          loading={mutation.isPending}
          disabled={mutation.isPending || !patientData || !selectedDate || !selectedTime}
          onPress={() => {
            setError('')
            if (!patientId.trim()) { setError('Patient ID is required'); return }
            if (!selectedDate || !selectedTime) { setError('Date and time are required'); return }
            mutation.mutate()
          }}
          contentStyle={styles.btnContent}
          labelStyle={styles.btnLabel}
        >
          Schedule Appointment
        </Button>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  form: { gap: Spacing.sm },
  input: { backgroundColor: Colors.surface },
  error: { color: Colors.error, marginBottom: Spacing.sm, fontWeight: '500' },
  info: { color: Colors.textLight, fontSize: 13, marginLeft: Spacing.xs },
  success: { color: Colors.success || '#2D3E18', fontSize: 13, marginLeft: Spacing.xs, fontWeight: '600' },
  warning: { color: Colors.warning || '#D97706', fontSize: 13, marginLeft: Spacing.xs },
  sectionLabel: { fontWeight: '700', color: Colors.text, marginTop: Spacing.sm },
  chipRow: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  chip: { backgroundColor: Colors.backgroundAlt },
  chipSelected: { backgroundColor: Colors.primary + '20' },
  chipTextSelected: { color: Colors.primary, fontWeight: '700' },
  specialistList: { gap: Spacing.sm },
  btnLabel: { color: Colors.white, fontWeight: '700' },
  btnContent: { height: 48 },
})
