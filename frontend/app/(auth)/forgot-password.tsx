import { useState } from 'react'
import { StyleSheet, ScrollView, KeyboardAvoidingView, Platform, View } from 'react-native'
import { TextInput, Button, Text } from 'react-native-paper'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../src/constants'
import { forgotPasswordApi, verifySecurityAnswerApi } from '../../src/features/auth/authApi'
import { getApiErrorMessage } from '../../src/utils/apiError'

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets()
  const [userId, setUserId] = useState('')
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [step, setStep] = useState<'identify' | 'challenge'>('identify')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleIdentify() {
    setError('')
    if (!userId.trim()) {
      setError('Please enter your User ID')
      return
    }
    setIsLoading(true)
    try {
      const res = await forgotPasswordApi(userId.trim().toUpperCase())
      setSecurityQuestion(res.security_question)
      setStep('challenge')
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerifyAnswer() {
    setError('')
    if (!answer.trim()) {
      setError('Please answer the security question')
      return
    }
    setIsLoading(true)
    try {
      const res = await verifySecurityAnswerApi(userId.trim().toUpperCase(), answer.trim())
      router.replace({
        pathname: '/(auth)/reset-password',
        params: { user_id: userId.trim().toUpperCase(), code: res.reset_code },
      })
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'))
    } finally {
      setIsLoading(false)
    }
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
            <Ionicons name="key" size={36} color={Colors.white} />
          </View>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            {step === 'identify'
              ? 'Enter your User ID to retrieve your security question'
              : 'Answer your security question to get a reset code'}
          </Text>
        </View>

        <View style={styles.formCard}>
          {step === 'identify' ? (
            <TextInput
              label="User ID"
              value={userId}
              onChangeText={(v) => { setUserId(v); setError('') }}
              mode="outlined"
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isLoading}
              placeholder="e.g. CS-200001"
              left={<TextInput.Icon icon="badge-account-outline" color={Colors.primaryLight} />}
              style={styles.input}
            textColor={Colors.text}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              theme={{ roundness: 10 }}
            />
          ) : (
            <>
              <View style={styles.questionBox}>
                <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
                <Text style={styles.question}>{securityQuestion}</Text>
              </View>
              <TextInput
                label="Your Answer"
                value={answer}
                onChangeText={(v) => { setAnswer(v); setError('') }}
                mode="outlined"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                left={<TextInput.Icon icon="chat-question-outline" color={Colors.primaryLight} />}
                style={styles.input}
            textColor={Colors.text}
                outlineColor={Colors.border}
                activeOutlineColor={Colors.primary}
                theme={{ roundness: 10 }}
              />
            </>
          )}

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <Button
            mode="contained"
            onPress={step === 'identify' ? handleIdentify : handleVerifyAnswer}
            loading={isLoading}
            disabled={isLoading}
            buttonColor={Colors.primary}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            style={styles.button}
            theme={{ roundness: 10 }}
          >
            {step === 'identify' ? 'Continue' : 'Verify Answer'}
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

  questionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight + '20',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  question: { color: Colors.text, fontSize: 14, fontWeight: '600', flex: 1 },

  input: { marginBottom: Spacing.md, backgroundColor: Colors.white },

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
