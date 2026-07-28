import { useState } from 'react'
import { StyleSheet, ScrollView, View } from 'react-native'
import { Text, TextInput, Button, Portal, Modal } from 'react-native-paper'
import { Screen, PageHeader } from '../../../src/components'
import { adminApi } from '../../../src/core/api/adminApi'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import { getApiErrorMessage } from '../../../src/utils/apiError'
import { useFormValidation, required } from '../../../src/hooks/useFormValidation'
import type { UserRole } from '../../../src/types'

const ROLES: { value: UserRole; label: string; icon: string; color: string; desc: string }[] = [
  { value: 'ADMIN', label: 'Admin', icon: 'shield-checkmark', color: '#DC3545', desc: 'Full system access' },
  { value: 'SPECIALIST', label: 'Specialist', icon: 'medical', color: '#2D3E18', desc: 'Doctors & specialists' },
  { value: 'CLINIC_STAFF', label: 'Clinic Staff', icon: 'people', color: '#17A2B8', desc: 'Front desk & nurses' },
  { value: 'LAB_OFFICER', label: 'Lab Officer', icon: 'flask', color: '#FFC107', desc: 'Lab results & tests' },
  { value: 'RIDER', label: 'Rider', icon: 'bicycle', color: '#6F42C1', desc: 'Medication delivery' },
]

const SPECIALTIES = [
  'Cardiology', 'Dermatology', 'Endocrinology', 'Family Medicine',
  'General Surgery', 'Internal Medicine', 'Neurology', 'Obstetrics & Gynecology',
  'Oncology', 'Ophthalmology', 'Orthopedics', 'Pediatrics',
  'Psychiatry', 'Radiology', 'Urology',
]

export default function CreateUserScreen() {
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<UserRole>('CLINIC_STAFF')
  const [speciality, setSpeciality] = useState('')
  const [clinicId, setClinicId] = useState<number | null>(null)
  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false)
  const [showClinicPicker, setShowClinicPicker] = useState(false)
  const [error, setError] = useState('')
  const [createdUserId, setCreatedUserId] = useState<string | null>(null)
  const [createdUserName, setCreatedUserName] = useState('')

  const { validate, getFieldError, clearFieldError, clearAllErrors } = useFormValidation(
    {
      fullName: required('Full name'),
      password: (v: string) => {
        if (!v) return 'Password is required'
        if (v.length < 8) return 'Password must be at least 8 characters'
        return null
      },
    },
    null
  )

  const { data: clinicData } = useQuery({
    queryKey: ['admin-clinics'],
    queryFn: () => adminApi.listClinics(),
  })

  const clinics = clinicData?.clinics || []

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => adminApi.createUser(payload),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      if (data?.user?.user_id) {
        setCreatedUserId(data.user.user_id)
        setCreatedUserName(fullName.trim())
      } else {
        router.back()
      }
    },
    onError: (err: unknown) => {
      setError(getApiErrorMessage(err, 'Failed to create user'))
    },
  })

  function handleSubmit() {
    setError('')
    clearAllErrors()
    if (!validate({ fullName, password })) return

    const payload: Record<string, unknown> = {
      full_name: fullName.trim(),
      password,
      role,
    }
    if (phone.trim()) payload.phone = phone.trim()
    if (email.trim()) payload.email = email.trim().toLowerCase()
    if (speciality) payload.speciality = speciality
    if (clinicId) payload.clinic_id = clinicId

    createMutation.mutate(payload)
  }

  const selectedRole = ROLES.find(r => r.value === role)

  return (
    <Screen>
      <PageHeader title="Create User" subtitle="Add a new system account" />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.roleSection}>
          <Text style={styles.sectionTitle}>Select Role</Text>
          <View style={styles.roleGrid}>
            {ROLES.map((r) => (
              <View
                key={r.value}
                style={[styles.roleCard, role === r.value && { borderColor: r.color, backgroundColor: r.color + '08' }]}
              >
                <Button
                  mode="text"
                  onPress={() => { setRole(r.value); setError('') }}
                  style={styles.roleCardBtn}
                  labelStyle={styles.roleCardLabel}
                  contentStyle={styles.roleCardContent}
                  accessibilityLabel={`Select ${r.label} role`}
                >
                  <View style={styles.roleCardInner}>
                    <View style={[styles.roleIconWrap, { backgroundColor: r.color + '15' }]}>
                      <Ionicons name={r.icon as any} size={22} color={r.color} />
                    </View>
                    <Text style={[styles.roleCardTitle, role === r.value && { color: r.color }]}>{r.label}</Text>
                    <Text style={styles.roleCardDesc}>{r.desc}</Text>
                  </View>
                </Button>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Account Details</Text>

          <TextInput
            label="Full Name"
            value={fullName}
            onChangeText={(v) => { setFullName(v); clearFieldError('fullName') }}
            mode="outlined"
            autoCapitalize="words"
            left={<TextInput.Icon icon="account-outline" color={Colors.primaryLight} />}
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            error={!!getFieldError('fullName')}
            theme={{ roundness: 10 }}
          />
          {getFieldError('fullName') && (
            <Text style={styles.fieldError}>{getFieldError('fullName')}</Text>
          )}

          <TextInput
            label="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            mode="outlined"
            left={<TextInput.Icon icon="phone-outline" color="#4CAF50" />}
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            theme={{ roundness: 10 }}
          />

          <TextInput
            label="Email (optional)"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            left={<TextInput.Icon icon="email-outline" color={Colors.primaryLight} />}
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            theme={{ roundness: 10 }}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={(v) => { setPassword(v); clearFieldError('password') }}
            mode="outlined"
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock-outline" color={Colors.primaryLight} />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setShowPassword(!showPassword)}
                forceTextInputFocus={false}
                color={Colors.textLight}
              />
            }
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            error={!!getFieldError('password')}
            theme={{ roundness: 10 }}
          />
          {getFieldError('password') && (
            <Text style={styles.fieldError}>{getFieldError('password')}</Text>
          )}

          {password.length > 0 && (
            <View style={styles.passwordHints}>
              {[
                { label: 'At least 8 characters', met: password.length >= 8 },
                { label: 'Has uppercase letter', met: /[A-Z]/.test(password) },
                { label: 'Has lowercase letter', met: /[a-z]/.test(password) },
                { label: 'Has a number', met: /\d/.test(password) },
              ].map((hint) => (
                <View key={hint.label} style={styles.hintRow}>
                  <Ionicons
                    name={hint.met ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={hint.met ? '#4CAF50' : Colors.textLight}
                  />
                  <Text style={[styles.hintText, hint.met && { color: '#4CAF50' }]}>{hint.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {(role === 'SPECIALIST' || role === 'CLINIC_STAFF') && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Speciality</Text>
            <Button
              mode="outlined"
              onPress={() => setShowSpecialtyPicker(true)}
              icon="chevron-down"
              style={styles.pickerBtn}
              contentStyle={styles.pickerContent}
              labelStyle={[styles.pickerLabel, speciality && { color: Colors.text }]}
            >
              {speciality || 'Select speciality...'}
            </Button>
          </View>
        )}

        {role === 'CLINIC_STAFF' && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Assign Clinic</Text>
            <Button
              mode="outlined"
              onPress={() => setShowClinicPicker(true)}
              icon="chevron-down"
              style={styles.pickerBtn}
              contentStyle={styles.pickerContent}
              labelStyle={[styles.pickerLabel, clinicId != null ? { color: Colors.text } : undefined]}
            >
              {clinics.find(c => c.id === clinicId)?.name || 'Select clinic...'}
            </Button>
          </View>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button mode="outlined" onPress={() => router.back()} style={styles.actionBtn} accessibilityLabel="Cancel">
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={createMutation.isPending}
            disabled={createMutation.isPending}
            buttonColor={selectedRole?.color || Colors.primary}
            style={styles.actionBtn}
            accessibilityLabel="Create user"
            accessibilityHint="Creates a new user account"
          >
            Create {selectedRole?.label || 'User'}
          </Button>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Portal>
        <Modal visible={showSpecialtyPicker} onDismiss={() => setShowSpecialtyPicker(false)} contentContainerStyle={styles.pickerModal}>
          <Text style={styles.pickerModalTitle}>Select Speciality</Text>
          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            {SPECIALTIES.map((s) => (
              <Button
                key={s}
                mode={speciality === s ? 'contained' : 'text'}
                onPress={() => { setSpeciality(s); setShowSpecialtyPicker(false) }}
                buttonColor={speciality === s ? Colors.primary : undefined}
                style={styles.pickerOption}
                contentStyle={styles.pickerOptionContent}
              >
                {s}
              </Button>
            ))}
          </ScrollView>
          <Button mode="text" onPress={() => { setSpeciality(''); setShowSpecialtyPicker(false) }} style={{ marginTop: Spacing.sm }}>
            Clear Selection
          </Button>
        </Modal>

        <Modal visible={showClinicPicker} onDismiss={() => setShowClinicPicker(false)} contentContainerStyle={styles.pickerModal}>
          <Text style={styles.pickerModalTitle}>Select Clinic</Text>
          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            {clinics.map((c) => (
              <Button
                key={c.id}
                mode={clinicId === c.id ? 'contained' : 'text'}
                onPress={() => { setClinicId(c.id); setShowClinicPicker(false) }}
                buttonColor={clinicId === c.id ? Colors.primary : undefined}
                style={styles.pickerOption}
                contentStyle={styles.pickerOptionContent}
              >
                {c.name} — {c.district}
              </Button>
            ))}
          </ScrollView>
          <Button mode="text" onPress={() => { setClinicId(null); setShowClinicPicker(false) }} style={{ marginTop: Spacing.sm }}>
            Clear Selection
          </Button>
        </Modal>

        <Modal visible={!!createdUserId} onDismiss={() => { setCreatedUserId(null); router.back() }} contentContainerStyle={styles.successModal}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={56} color="#4CAF50" />
          </View>
          <Text style={styles.successTitle}>User Created!</Text>
          <Text style={styles.successSubtitle}>{createdUserName}'s account is ready</Text>

          <View style={styles.userIdDisplay}>
            <Text style={styles.userIdLabel}>User ID</Text>
            <Text style={styles.userIdValue}>{createdUserId}</Text>
            <Text style={styles.userIdHint}>Share this ID with the user to log in</Text>
          </View>

          <Button
            mode="contained"
            buttonColor={Colors.primary}
            onPress={() => { setCreatedUserId(null); router.back() }}
            style={styles.successBtn}
          >
            Done
          </Button>
        </Modal>
      </Portal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },

  roleSection: { marginBottom: Spacing.lg },
  roleGrid: { gap: Spacing.sm },
  roleCard: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  roleCardBtn: { padding: 0, margin: 0 },
  roleCardContent: { height: 'auto', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md },
  roleCardLabel: { textAlign: 'left', width: '100%' },
  roleCardInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  roleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleCardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  roleCardDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },

  formSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  input: { marginBottom: Spacing.md, backgroundColor: Colors.backgroundAlt },

  fieldError: { color: Colors.error, fontSize: 12, marginTop: -Spacing.sm, marginBottom: Spacing.sm, marginLeft: 4 },

  passwordHints: { gap: 4, marginTop: -Spacing.sm, marginBottom: Spacing.sm },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintText: { fontSize: 12, color: Colors.textSecondary },

  pickerBtn: { borderColor: Colors.border, borderRadius: 10 },
  pickerContent: { height: 48, justifyContent: 'space-between' },
  pickerLabel: { color: Colors.textLight, fontWeight: '500' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: 13, fontWeight: '600', flex: 1 },

  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flex: 1, borderRadius: 12 },

  pickerModal: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    margin: Spacing.lg,
    borderRadius: 20,
  },
  pickerModalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
  pickerOption: { justifyContent: 'flex-start' },
  pickerOptionContent: { height: 48 },

  successModal: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    margin: Spacing.lg,
    borderRadius: 20,
    alignItems: 'center',
  },
  successIcon: { marginBottom: Spacing.md },
  successTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  successSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  userIdDisplay: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 16,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userIdLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  userIdValue: { fontSize: 28, fontWeight: '800', color: Colors.primary, letterSpacing: 2, marginTop: 4 },
  userIdHint: { fontSize: 12, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  successBtn: { width: '100%', borderRadius: 12, marginTop: Spacing.lg },
})
