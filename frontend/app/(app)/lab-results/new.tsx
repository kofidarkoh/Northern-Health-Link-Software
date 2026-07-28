import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TextInput, Button, Text } from 'react-native-paper'
import { Screen, PageHeader } from '../../../src/components'
import { clinicalApi } from '../../../src/core/api'
import { useAuth } from '../../../src/features/auth'
import { getApiErrorMessage } from '../../../src/utils/apiError'
import { Colors, Spacing } from '../../../src/constants'

export default function NewLabResultScreen() {
  const { hasRole } = useAuth()
  const params = useLocalSearchParams<{ lab_request_id?: string; test_type?: string }>()
  const qc = useQueryClient()

  const [labRequestId, setLabRequestId] = useState(params.lab_request_id ?? '')
  const [resultSummary, setResultSummary] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      clinicalApi.createLabResult({
        lab_request_id: Number(labRequestId),
        result_summary: resultSummary.trim(),
        file_url: fileUrl.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lab-results'] })
      qc.invalidateQueries({ queryKey: ['lab-requests'] })
      router.replace('/(app)/lab-results')
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  if (!hasRole('LAB_OFFICER', 'ADMIN')) {
    return (
      <Screen>
        <PageHeader title="Upload Results" />
        <Text style={styles.error}>Access denied. Only Lab Officers can upload results.</Text>
      </Screen>
    )
  }

  return (
    <Screen>
      <PageHeader
        title="Upload Results"
        subtitle={params.test_type ? `Submit results for ${params.test_type}` : 'Submit Lab Diagnostic Files'}
      />
      <View style={styles.form}>
        <TextInput
          label="Lab Request ID *"
          value={labRequestId}
          onChangeText={setLabRequestId}
          keyboardType="number-pad"
          mode="outlined"
          style={styles.input}
          theme={{ roundness: 10 }}
          editable={!params.lab_request_id}
        />

        <TextInput
          label="Result Summary *"
          placeholder="e.g. Blood film positive for Plasmodium falciparum (+3)"
          value={resultSummary}
          onChangeText={setResultSummary}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.input}
          theme={{ roundness: 10 }}
        />

        <TextInput
          label="File URL (optional)"
          placeholder="e.g. http://example.com/scan.pdf"
          value={fileUrl}
          onChangeText={setFileUrl}
          mode="outlined"
          style={styles.input}
          theme={{ roundness: 10 }}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          mode="contained"
          buttonColor={Colors.primary}
          loading={mutation.isPending}
          disabled={mutation.isPending || !labRequestId || !resultSummary.trim()}
          onPress={() => {
            setError('')
            mutation.mutate()
          }}
          labelStyle={styles.buttonLabel}
          contentStyle={styles.buttonContent}
        >
          Submit Results
        </Button>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  form: { gap: Spacing.sm },
  input: { backgroundColor: Colors.surface },
  error: { color: Colors.error, marginBottom: Spacing.sm, fontWeight: '500' },
  buttonLabel: { color: Colors.white, fontWeight: '700' },
  buttonContent: { height: 48 },
})
