import { useState } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { Text, TextInput, Button } from 'react-native-paper'
import { Screen, PageHeader } from '../../../src/components'
import { useMutation } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import { router } from 'expo-router'
import { profileApi } from '../../../src/core/api/profileApi'
import { getApiErrorMessage } from '../../../src/utils/apiError'
import { useFormValidation } from '../../../src/hooks/useFormValidation'

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [apiError, setApiError] = useState('')

  const { validate, getFieldError, clearFieldError, clearAllErrors } = useFormValidation(
    {
      currentPassword: (v) => {
        if (!v) return 'Current password is required'
        return null
      },
      newPassword: (v) => {
        if (!v) return 'New password is required'
        if (v.length < 8) return 'Password must be at least 8 characters'
        return null
      },
      confirmPassword: (v) => {
        if (!v) return 'Please confirm your password'
        if (v !== newPassword) return 'Passwords do not match'
        return null
      },
    },
    null
  )

  const strength = getPasswordStrength(newPassword)

  const mutation = useMutation({
    mutationFn: () =>
      profileApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    onSuccess: () => {
      Alert.alert('Password Changed', 'Your password has been updated.', [{ text: 'OK', onPress: () => router.back() }])
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    },
    onError: (err) => setApiError(getApiErrorMessage(err)),
  })

  const handleSubmit = () => {
    setApiError('')
    clearAllErrors()
    const isValid = validate({ currentPassword, newPassword, confirmPassword })
    if (!isValid) return
    mutation.mutate()
  }

  const canSubmit = currentPassword.trim() && newPassword.trim() && confirmPassword.trim() && strength.label !== 'Weak'

  return (
    <Screen scroll={false}>
      <PageHeader title="Change Password" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.heroIcon}>
            <View style={[styles.heroCircle, { backgroundColor: '#FF8C00' + '12' }]}>
              <Ionicons name="lock-closed" size={28} color="#FF8C00" />
            </View>
            <Text style={styles.heroTitle}>Change Password</Text>
            <Text style={styles.heroSubtitle}>Update your account password</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Security</Text>
            <TextInput
              label="Current Password *"
              value={currentPassword}
              onChangeText={(v) => { setCurrentPassword(v); clearFieldError('currentPassword') }}
              secureTextEntry={!showCurrent}
              mode="outlined"
              left={<TextInput.Icon icon="lock-closed" color="#DC3545" />}
              right={<TextInput.Icon icon={showCurrent ? 'eye-off' : 'eye'} onPress={() => setShowCurrent(!showCurrent)} color={Colors.textSecondary} />}
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 10 }}
              error={!!getFieldError('currentPassword')}
            />
            {getFieldError('currentPassword') ? (
              <Text style={{ color: '#DC3545', fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4 }}>{getFieldError('currentPassword')}</Text>
            ) : null}
            <TextInput
              label="New Password *"
              value={newPassword}
              onChangeText={(v) => { setNewPassword(v); clearFieldError('newPassword') }}
              secureTextEntry={!showNew}
              mode="outlined"
              left={<TextInput.Icon icon="key" color={Colors.primary} />}
              right={<TextInput.Icon icon={showNew ? 'eye-off' : 'eye'} onPress={() => setShowNew(!showNew)} color={Colors.textSecondary} />}
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 10 }}
              error={!!getFieldError('newPassword')}
            />
            {getFieldError('newPassword') ? (
              <Text style={{ color: '#DC3545', fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4 }}>{getFieldError('newPassword')}</Text>
            ) : null}
            {newPassword.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBarContainer}>
                  {[1, 2, 3, 4].map(i => (
                    <View key={i} style={[styles.strengthSegment, i <= strength.score && { backgroundColor: strength.color }]} />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}
            <TextInput
              label="Confirm New Password *"
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); clearFieldError('confirmPassword') }}
              secureTextEntry={!showConfirm}
              mode="outlined"
              left={<TextInput.Icon icon="checkmark-circle" color="#4CAF50" />}
              right={<TextInput.Icon icon={showConfirm ? 'eye-off' : 'eye'} onPress={() => setShowConfirm(!showConfirm)} color={Colors.textSecondary} />}
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 10 }}
              error={!!getFieldError('confirmPassword')}
            />
            {getFieldError('confirmPassword') ? (
              <Text style={{ color: '#DC3545', fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4 }}>{getFieldError('confirmPassword')}</Text>
            ) : null}
            {confirmPassword.length > 0 && (
              <View style={styles.matchRow}>
                <Ionicons name={newPassword === confirmPassword ? 'checkmark-circle' : 'close-circle'} size={16} color={newPassword === confirmPassword ? '#4CAF50' : '#DC3545'} />
                <Text style={[styles.matchText, { color: newPassword === confirmPassword ? '#4CAF50' : '#DC3545' }]}>
                  {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                </Text>
              </View>
            )}
          </View>

          {apiError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.error}>{apiError}</Text>
            </View>
          ) : null}

          <Button
            mode="contained"
            buttonColor="#FF8C00"
            loading={mutation.isPending}
            disabled={mutation.isPending || !canSubmit}
            onPress={handleSubmit}
            icon="lock-closed"
            style={styles.submitBtn}
            accessibilityLabel="Change password"
            accessibilityHint="Updates your password"
          >
            Change Password
          </Button>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: '', color: Colors.textSecondary }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 1) return { score, label: 'Weak', color: '#DC3545' }
  if (score === 2) return { score, label: 'Fair', color: '#FFC107' }
  if (score === 3) return { score, label: 'Strong', color: '#FF8C00' }
  return { score, label: 'Very Strong', color: '#4CAF50' }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.md },
  heroIcon: { alignItems: 'center', paddingVertical: Spacing.lg, marginBottom: Spacing.md },
  heroCircle: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  heroTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  heroSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  sectionCard: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.sm, paddingHorizontal: 4 },
  input: { marginBottom: Spacing.sm, backgroundColor: Colors.backgroundAlt },

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm, paddingHorizontal: 4 },
  strengthBarContainer: { flex: 1, flexDirection: 'row', gap: 3 },
  strengthSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  strengthLabel: { fontSize: 11, fontWeight: '700' },

  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, marginBottom: Spacing.sm },
  matchText: { fontSize: 12, fontWeight: '600' },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.errorLight, padding: Spacing.md, borderRadius: 12, marginBottom: Spacing.md },
  error: { color: Colors.error, fontSize: 13, fontWeight: '600', flex: 1 },

  submitBtn: { borderRadius: 12 },
})
