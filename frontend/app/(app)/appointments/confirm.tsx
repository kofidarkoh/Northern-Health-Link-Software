import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, Button, Divider } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { Screen } from '../../../src/components'
import { Colors, Spacing } from '../../../src/constants'
import { router, useLocalSearchParams } from 'expo-router'

export default function BookingConfirmationScreen() {
  const params = useLocalSearchParams<{
    appointmentId?: string
    patientName?: string
    specialistName?: string
    specialty?: string
    date?: string
    time?: string
  }>()

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.primary} />
        </View>

        <Text variant="headlineSmall" style={styles.title}>Appointment Confirmed</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Your consultation has been scheduled successfully.
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="person-outline" size={18} color={Colors.primary} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Patient</Text>
              <Text style={styles.rowValue}>{params.patientName || 'N/A'}</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.row}>
            <Ionicons name="medkit" size={18} color={Colors.primary} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Specialist</Text>
              <Text style={styles.rowValue}>{params.specialistName || 'N/A'}</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.row}>
            <Ionicons name="star-outline" size={18} color={Colors.secondary} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Specialty</Text>
              <Text style={styles.rowValue}>{params.specialty || 'General Medicine'}</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Date & Time</Text>
              <Text style={styles.rowValue}>
                {params.date || 'N/A'} at {params.time || 'N/A'}
              </Text>
            </View>
          </View>

          {params.appointmentId ? (
            <>
              <Divider style={styles.divider} />
              <View style={styles.row}>
                <Ionicons name="pricetag-outline" size={18} color={Colors.textSecondary} />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowLabel}>Appointment ID</Text>
                  <Text style={styles.rowValue}>#{params.appointmentId}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        <Text variant="bodySmall" style={styles.note}>
          You will receive a notification when the specialist confirms. Please arrive 10 minutes before your scheduled time.
        </Text>

        <View style={styles.actions}>
          <Button
            mode="contained"
            buttonColor={Colors.primary}
            onPress={() => router.replace('/(app)/(tabs)')}
            style={styles.btn}
            contentStyle={styles.btnContent}
          >
            Back to Home
          </Button>
          <Button
            mode="outlined"
            onPress={() => router.push('/(app)/appointments')}
            style={styles.btn}
            contentStyle={styles.btnContent}
          >
            View Appointments
          </Button>
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  iconWrap: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  rowValue: { fontSize: 15, color: Colors.text, fontWeight: '600', marginTop: 2 },
  divider: { marginVertical: Spacing.sm },
  note: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  actions: { width: '100%', gap: Spacing.sm },
  btn: { borderRadius: 12 },
  btnContent: { height: 48 },
})
