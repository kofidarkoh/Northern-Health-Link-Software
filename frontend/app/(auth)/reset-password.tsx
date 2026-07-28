import React, { useState } from 'react'
import { StyleSheet, ScrollView, KeyboardAvoidingView, Platform, View } from 'react-native'
import { TextInput, Button, Text } from 'react-native-paper'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../src/constants'
import { resetPasswordApi } from '../../src/features/auth/authApi'
import { getApiErrorMessage } from '../../src/utils/apiError'

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets()
  const { email: presetEmail } = useLocalSearchParams<{ email?: string }>()
  const [email, setEmail] = useState(presetEmail || '')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    setError('')
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!code.trim()) {
      setError('Reset code is required')
      return
    }
    if (!newPassword) {
      setError('New password is required')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setIsLoading(true)
    try {
      await resetPasswordApi(email.trim().toLowerCase(), code.trim(), newPassword)
      setSuccess(true)
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl + 10 }]}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.brand}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Password Reset!</Text>
            <Text style={styles.subtitle}>Your password has been updated successfully</Text>
          </View>

          <View style={styles.formCard}>
            <Button
              mode="contained"
              onPress={() => router.replace('/(auth)/login')}
              buttonColor={Colors.primary}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              style={styles.button}
              theme={{ roundness: 10 }}
            >
              Sign In
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl + 10 }]}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.brand}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed" size={36} color={Colors.white} />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter the code from your email and your new password</Text>
        </View>

        <View style={styles.formCard}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={(v) => { setEmail(v); setError('') }}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
            left={<TextInput.Icon icon="email-outline" color={Colors.primaryLight} />}
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            theme={{ roundness: 10 }}
          />

          <TextInput
            label="Reset Code"
            value={code}
            onChangeText={(v) => { setCode(v.toUpperCase()); setError('') }}
            mode="outlined"
            autoCapitalize="characters"
            editable={!isLoading}
            left={<TextInput.Icon icon="key-outline" color={Colors.primaryLight} />}
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            theme={{ roundness: 10 }}
          />

          <TextInput
            label="New Password"
            value={newPassword}
            onChangeText={(v) => { setNewPassword(v); setError('') }}
            mode="outlined"
            secureTextEntry={!showPassword}
            editable={!isLoading}
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
            theme={{ roundness: 10 }}
          />

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); setError('') }}
            mode="outlined"
            secureTextEntry={!showPassword}
            editable={!isLoading}
            left={<TextInput.Icon icon="lock-check-outline" color={Colors.primaryLight} />}
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            theme={{ roundness: 10 }}
          />

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            buttonColor={Colors.primary}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            style={styles.button}
            theme={{ roundness: 10 }}
          >
            Reset Password
          </Button>

          <Button
            mode="text"
            onPress={() => router.back()}
            labelStyle={styles.backLabel}
            style={{ marginTop: Spacing.md }}
          >
            Back to Login
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, justifyContent: 'center' },

  brand: { alignItems: 'center', marginBottom: Spacing.xl },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' },
      default: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  successIcon: { marginBottom: Spacing.md },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 4, textAlign: 'center', paddingHorizontal: Spacing.lg },

  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: Spacing.xl,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' },
      default: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },

  input: { marginBottom: Spacing.md, backgroundColor: Colors.backgroundAlt },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  error: { color: Colors.error, fontSize: 13, fontWeight: '600', flex: 1 },

  button: { marginTop: Spacing.sm },
  buttonContent: { height: 54 },
  buttonLabel: { fontSize: 16, fontWeight: '700', color: Colors.white, letterSpacing: 0.5 },
  backLabel: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
})
