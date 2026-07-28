import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { Text, TextInput, Button } from 'react-native-paper'
import { Screen, PageHeader } from '../../../src/components'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import { router } from 'expo-router'
import { profileApi } from '../../../src/core/api/profileApi'
import type { User } from '../../../src/types'
import { getApiErrorMessage } from '../../../src/utils/apiError'
import { useFormValidation, required } from '../../../src/hooks/useFormValidation'

export default function EditProfileScreen() {
  const qc = useQueryClient()

  const { data: profile, isLoading } = useQuery<User>({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  })

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [apiError, setApiError] = useState('')

  const { validate, getFieldError, clearFieldError, clearAllErrors, hasErrors } = useFormValidation(
    {
      fullName: required('Full name'),
    },
    null
  )

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
    }
  }, [profile])

  const mutation = useMutation({
    mutationFn: () =>
      profileApi.updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      Alert.alert('Profile Updated', 'Your profile has been updated.', [{ text: 'OK', onPress: () => router.back() }])
    },
    onError: (err) => setApiError(getApiErrorMessage(err)),
  })

  const handleSubmit = () => {
    setApiError('')
    clearAllErrors()
    const isValid = validate({ fullName })
    if (!isValid) return
    mutation.mutate()
  }

  return (
    <Screen scroll={false}>
      <PageHeader title="Edit Profile" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.heroIcon}>
            <View style={styles.heroCircle}>
              <Ionicons name="create" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Edit Profile</Text>
            <Text style={styles.heroSubtitle}>Update your personal information</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>User ID</Text>
            <TextInput
              label="User ID"
              value={profile?.user_id || ''}
              mode="outlined"
              disabled
              left={<TextInput.Icon icon="badge-account" color={Colors.primary} />}
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 10 }}
            />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TextInput
              label="Full Name *"
              value={fullName}
              onChangeText={(v) => { setFullName(v); clearFieldError('fullName') }}
              mode="outlined"
              left={<TextInput.Icon icon="person" color={Colors.primaryLight} />}
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 10 }}
              error={!!getFieldError('fullName')}
            />
            {getFieldError('fullName') ? (
              <Text style={{ color: '#DC3545', fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4 }}>{getFieldError('fullName')}</Text>
            ) : null}
            <TextInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              mode="outlined"
              left={<TextInput.Icon icon="call" color="#4CAF50" />}
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 10 }}
            />
            <TextInput
              label="Email"
              value={profile?.email || ''}
              mode="outlined"
              disabled
              left={<TextInput.Icon icon="mail" color={Colors.textSecondary} />}
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 10 }}
            />
            <TextInput
              label="Role"
              value={profile?.role?.replace('_', ' ') || ''}
              mode="outlined"
              disabled
              left={<TextInput.Icon icon="shield" color={Colors.textSecondary} />}
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 10 }}
            />
          </View>

          {apiError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.error}>{apiError}</Text>
            </View>
          ) : null}

          <Button
            mode="contained"
            buttonColor={Colors.primary}
            loading={mutation.isPending}
            disabled={mutation.isPending || !fullName.trim()}
            onPress={handleSubmit}
            icon="checkmark-circle"
            style={styles.submitBtn}
            accessibilityLabel="Save changes"
          >
            Save Changes
          </Button>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.md },
  heroIcon: { alignItems: 'center', paddingVertical: Spacing.lg, marginBottom: Spacing.md },
  heroCircle: { width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.primary + '12', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  heroTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  heroSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  sectionCard: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.sm, paddingHorizontal: 4 },
  input: { marginBottom: Spacing.sm, backgroundColor: Colors.backgroundAlt },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.errorLight, padding: Spacing.md, borderRadius: 12, marginBottom: Spacing.md },
  error: { color: Colors.error, fontSize: 13, fontWeight: '600', flex: 1 },

  submitBtn: { borderRadius: 12 },
})
