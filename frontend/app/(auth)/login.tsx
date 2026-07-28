import React, { useState } from 'react'
import { StyleSheet, ScrollView, KeyboardAvoidingView, Platform, View, Image } from 'react-native'
import { TextInput, Button, Text, Checkbox } from 'react-native-paper'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../src/constants'
import { useAuth } from '../../src/features/auth'
import { getApiErrorMessage } from '../../src/utils/apiError'

const LOGO = require('../../assets/log.png')

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const { login } = useAuth()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  async function handleLogin() {
    setError('')
    if (!userId.trim() || !password) {
      setError('Please enter your User ID and password')
      return
    }
    setIsLoading(true)
    try {
      await login(userId.trim().toUpperCase(), password)
      router.replace('/(app)/(tabs)')
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Network error. Please check your connection.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.bgTop} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        style={styles.scrollView}
      >
        <View style={styles.brand}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Northern Health Link</Text>
          <Text style={styles.subtitle}>Specialist Healthcare Platform</Text>
          <View style={styles.taglinePill}>
            <Ionicons name="heart" size={12} color="#fff" />
            <Text style={styles.taglineText}>Connecting Rural Clinics to Specialists</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <View style={styles.welcomeIcon}>
              <Ionicons name="person-circle" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in with your User ID to continue</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={Colors.error} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>User ID</Text>
            <TextInput
              value={userId}
              onChangeText={(v) => { setUserId(v); setError('') }}
              mode="outlined"
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isLoading}
              placeholder="e.g. CS-482917"
              placeholderTextColor={Colors.textLight}
              left={<TextInput.Icon icon="badge-account-outline" color={Colors.primary} forceTextInputFocus={false} />}
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 14, colors: { primary: Colors.primary, background: Colors.backgroundAlt } }}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              value={password}
              onChangeText={(v) => { setPassword(v); setError('') }}
              mode="outlined"
              secureTextEntry={!showPassword}
              editable={!isLoading}
              placeholder="Enter your password"
              placeholderTextColor={Colors.textLight}
              left={<TextInput.Icon icon="lock-outline" color={Colors.primary} />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setShowPassword(!showPassword)}
                  forceTextInputFocus={false}
                  color={Colors.textSecondary}
                />
              }
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 14, colors: { primary: Colors.primary, background: Colors.backgroundAlt } }}
            />
          </View>

          <View style={styles.optionsRow}>
            <Checkbox.Item
              label="Remember me"
              status={rememberMe ? 'checked' : 'unchecked'}
              onPress={() => setRememberMe(!rememberMe)}
              position="leading"
              style={styles.checkbox}
              labelStyle={styles.checkboxLabel}
              color={Colors.primary}
              accessibilityLabel="Remember me"
            />
            <Button mode="text" compact onPress={() => router.push('/(auth)/forgot-password')} labelStyle={styles.forgot} accessibilityLabel="Forgot password">
              Forgot password?
            </Button>
          </View>

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            buttonColor={Colors.primary}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            style={styles.button}
            theme={{ roundness: 14 }}
            accessibilityLabel="Sign in"
          >
            Sign In
          </Button>

          <View style={styles.helpRow}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textLight} />
            <Text style={styles.helpText}>Contact your admin if you forgot your User ID</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerPill}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
            <Text style={styles.footerText}>Secure & HIPAA Compliant</Text>
          </View>
          <Text style={styles.footerCopyright}>Northern Health Link v1.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  bgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  content: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, justifyContent: 'center' },

  brand: { alignItems: 'center', marginBottom: Spacing.xl, marginTop: 20 },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.md,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
      },
    }),
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.white, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  taglinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: Spacing.md,
  },
  taglineText: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },

  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' },
      default: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 32,
        elevation: 8,
      },
    }),
  },

  formHeader: { marginBottom: Spacing.lg, alignItems: 'center' },
  welcomeIcon: { marginBottom: Spacing.sm },
  formTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  formSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },

  inputGroup: { marginBottom: Spacing.md },
  inputLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: Colors.backgroundAlt },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight,
    padding: Spacing.md,
    borderRadius: 14,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error + '20',
  },
  error: { color: Colors.error, fontSize: 13, fontWeight: '600', flex: 1 },

  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginLeft: -Spacing.md,
  },
  checkbox: { padding: 0, paddingRight: 8, height: 40 },
  checkboxLabel: { fontSize: 13, color: Colors.textSecondary, marginLeft: -8 },
  forgot: { fontSize: 13, color: Colors.primary, fontWeight: '700' },

  button: { marginTop: Spacing.xs },
  buttonContent: { height: 56 },
  buttonLabel: { fontSize: 16, fontWeight: '700', color: Colors.white, letterSpacing: 0.3 },

  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.md,
  },
  helpText: { fontSize: 12, color: Colors.textLight, fontWeight: '500' },

  footer: { alignItems: 'center', marginTop: Spacing.md },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: Spacing.sm,
  },
  footerText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  footerCopyright: { fontSize: 11, color: Colors.textLight, fontWeight: '500' },
})
