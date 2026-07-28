import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TextInput, Button, Text } from 'react-native-paper'
import { Screen, PageHeader } from '../../../src/components'
import { clinicalApi, patientsApi } from '../../../src/core/api'
import { useAuth } from '../../../src/features/auth'
import { getApiErrorMessage } from '../../../src/utils/apiError'
import { Colors, Spacing } from '../../../src/constants'
import { useFormValidation, required } from '../../../src/hooks/useFormValidation'

export default function NewLabRequestScreen() {
  const { hasRole } = useAuth()
  const qc = useQueryClient()
  const [patientId, setPatientId] = useState('')
  const [testType, setTestType] = useState('')
  const [clinicalReason, setClinicalReason] = useState('')
  const [error, setError] = useState('')

  const { validate, getFieldError, clearFieldError } = useFormValidation(
    { testType: required('Test type') },
    null,
  )

  const numericPatientId = Number(patientId)
  const { data: patientData, isLoading: isLoadingPatient } = useQuery({
    queryKey: ['patient-verify', numericPatientId],
    queryFn: () => patientsApi.get(numericPatientId),
    enabled: Number.isFinite(numericPatientId) && numericPatientId > 0,
    retry: false,
  })

  const mutation = useMutation({
    mutationFn: () =>
      clinicalApi.createLabRequest({
        patient_id: numericPatientId,
        test_type: testType.trim(),
        clinical_reason: clinicalReason.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lab-requests'] })
      router.replace('/(app)/lab-requests')
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  if (!hasRole('CLINIC_STAFF', 'SPECIALIST', 'ADMIN')) {
    return (
      <Screen>
        <PageHeader title="New Lab Request" />
        <Text style={styles.error}>Access denied</Text>
      </Screen>
    )
  }

  return (
    <Screen>
      <PageHeader title="New Lab Request" subtitle="Order a diagnostic lab test" />
      <View style={styles.form}>
        <TextInput
          label="Patient ID *"
          value={patientId}
          onChangeText={setPatientId}
          keyboardType="number-pad"
          mode="outlined"
          style={styles.input}
          theme={{ roundness: 10 }}
        />
        {isLoadingPatient ? (
          <Text style={styles.info}>Verifying patient ID...</Text>
        ) : patientData ? (
          <Text style={styles.success}>✓ Patient found: {patientData.full_name} ({patientData.district})</Text>
        ) : patientId ? (
          <Text style={styles.warning}>Patient not found or invalid ID</Text>
        ) : null}

        <TextInput
          label="Test Type *"
          placeholder="e.g. Malaria RDT, Full Blood Count, Typhoid"
          value={testType}
          onChangeText={(text) => { setTestType(text); clearFieldError('testType') }}
          mode="outlined"
          error={!!getFieldError('testType')}
          style={styles.input}
          theme={{ roundness: 10 }}
        />
        {getFieldError('testType') ? (
          <Text style={{ color: '#DC3545', fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4 }}>{getFieldError('testType')}</Text>
        ) : null}

        <TextInput
          label="Clinical Reason (optional)"
          placeholder="e.g. Persistent fever and headache"
          value={clinicalReason}
          onChangeText={setClinicalReason}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
          theme={{ roundness: 10 }}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          mode="contained"
          buttonColor={Colors.primary}
          loading={mutation.isPending}
          disabled={mutation.isPending || !patientData || !testType.trim()}
          onPress={() => {
            setError('')
            if (!validate({ testType })) return
            if (!patientData) return
            mutation.mutate()
          }}
          labelStyle={styles.buttonLabel}
          contentStyle={styles.buttonContent}
        >
          Submit Lab Request
        </Button>
      </View>
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
  buttonLabel: { color: Colors.white, fontWeight: '700' },
  buttonContent: { height: 48 },
})
