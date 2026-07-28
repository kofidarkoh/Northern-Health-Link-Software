import { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, TextInput, Button, SegmentedButtons } from 'react-native-paper'
import { Screen, PageHeader, LoadingView, ErrorView } from '../../../../src/components'
import { patientsApi } from '../../../../src/core/api'
import { useAuth } from '../../../../src/features/auth'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../../src/constants'
import { router, useLocalSearchParams } from 'expo-router'
import { getApiErrorMessage } from '../../../../src/utils/apiError'
import { useFormValidation, required } from '../../../../src/hooks/useFormValidation'

export default function EditPatientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const patientId = Number(id)
  const { hasRole } = useAuth()
  const qc = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsApi.get(patientId),
    enabled: Number.isFinite(patientId),
  })

  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('Male')
  const [phone, setPhone] = useState('')
  const [district, setDistrict] = useState('')
  const [history, setHistory] = useState('')
  const [emergency, setEmergency] = useState('')
  const [formError, setFormError] = useState('')

  const { validate, getFieldError, clearFieldError, clearAllErrors } = useFormValidation(
    {
      fullName: required('Full name'),
      district: required('District'),
    },
    null
  )

  useEffect(() => {
    if (data) {
      setFullName(data.full_name)
      setAge(data.age?.toString() ?? '')
      setGender(data.gender)
      setPhone(data.contact_phone ?? '')
      setDistrict(data.district)
      setHistory(data.medical_history ?? '')
      setEmergency(data.emergency_contact ?? '')
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: () =>
      patientsApi.update(patientId, {
        full_name: fullName.trim(),
        age: age ? Number(age) : null,
        gender,
        contact_phone: phone.trim() || null,
        district: district.trim(),
        medical_history: history.trim() || null,
        emergency_contact: emergency.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      qc.invalidateQueries({ queryKey: ['patient', patientId] })
      router.back()
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  })

  if (!hasRole('CLINIC_STAFF', 'ADMIN')) {
    return <Screen><PageHeader title="Edit Patient" /><Text style={styles.error}>Access denied</Text></Screen>
  }

  if (isLoading) return <Screen scroll={false}><LoadingView /></Screen>
  if (error || !data) return <Screen scroll={false}><ErrorView message={getApiErrorMessage(error)} onRetry={refetch} /></Screen>

  return (
    <Screen>
      <PageHeader title="Edit Patient" subtitle={data.full_name} />

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.sectionCard}>
            <TextInput label="Full Name *" value={fullName} onChangeText={v => { setFullName(v); clearFieldError('fullName') }} error={!!getFieldError('fullName')} mode="outlined" left={<TextInput.Icon icon="account-outline" color={Colors.primaryLight} />} style={styles.input} outlineColor={Colors.border} activeOutlineColor={Colors.primary} theme={{ roundness: 10 }} />
            {getFieldError('fullName') ? (
              <Text style={{ color: '#DC3545', fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4 }}>{getFieldError('fullName')}</Text>
            ) : null}
            <TextInput label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" mode="outlined" left={<TextInput.Icon icon="calendar-outline" color={Colors.primaryLight} />} style={styles.input} outlineColor={Colors.border} activeOutlineColor={Colors.primary} theme={{ roundness: 10 }} />
            <Text style={styles.fieldLabel}>Gender</Text>
            <SegmentedButtons value={gender} onValueChange={setGender} buttons={[{ value: 'Male', label: 'Male', icon: 'gender-male' }, { value: 'Female', label: 'Female', icon: 'gender-female' }, { value: 'Other', label: 'Other' }]} style={styles.segmented} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          <View style={styles.sectionCard}>
            <TextInput label="Contact Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" mode="outlined" left={<TextInput.Icon icon="phone-outline" color={Colors.primaryLight} />} style={styles.input} outlineColor={Colors.border} activeOutlineColor={Colors.primary} theme={{ roundness: 10 }} />
            <TextInput label="District *" value={district} onChangeText={v => { setDistrict(v); clearFieldError('district') }} error={!!getFieldError('district')} mode="outlined" left={<TextInput.Icon icon="map-marker-outline" color={Colors.primaryLight} />} style={styles.input} outlineColor={Colors.border} activeOutlineColor={Colors.primary} theme={{ roundness: 10 }} />
            {getFieldError('district') ? (
              <Text style={{ color: '#DC3545', fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4 }}>{getFieldError('district')}</Text>
            ) : null}
            <TextInput label="Emergency Contact" value={emergency} onChangeText={setEmergency} mode="outlined" left={<TextInput.Icon icon="account-group-outline" color={Colors.primaryLight} />} style={styles.input} outlineColor={Colors.border} activeOutlineColor={Colors.primary} theme={{ roundness: 10 }} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          <View style={styles.sectionCard}>
            <TextInput label="Medical History" value={history} onChangeText={setHistory} mode="outlined" multiline numberOfLines={3} left={<TextInput.Icon icon="medical-bag" color={Colors.primaryLight} />} style={styles.input} outlineColor={Colors.border} activeOutlineColor={Colors.primary} theme={{ roundness: 10 }} />
          </View>
        </View>

        {formError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.error}>{formError}</Text>
          </View>
        ) : null}

        <Button mode="contained" buttonColor={Colors.primary} loading={mutation.isPending} disabled={mutation.isPending} onPress={() => { setFormError(''); clearAllErrors(); if (!validate({ fullName, district })) return; mutation.mutate() }} style={styles.submitBtn}>
          Update Patient
        </Button>
        <View style={{ height: 20 }} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  form: { gap: Spacing.sm },
  section: { marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.xs, paddingHorizontal: 4 },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  input: { marginBottom: Spacing.md, backgroundColor: Colors.backgroundAlt },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  segmented: { marginBottom: Spacing.sm },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.errorLight, padding: Spacing.md, borderRadius: 12 },
  error: { color: Colors.error, fontSize: 13, fontWeight: '600', flex: 1 },
  submitBtn: { borderRadius: 12, marginTop: Spacing.sm },
})
