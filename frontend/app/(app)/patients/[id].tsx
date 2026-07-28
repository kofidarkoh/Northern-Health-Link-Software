import { StyleSheet, View, ScrollView } from 'react-native'
import { Text, Button } from 'react-native-paper'
import { Screen, PageHeader, LoadingView, ErrorView } from '../../../src/components'
import { patientsApi } from '../../../src/core/api'
import { useAuth } from '../../../src/features/auth'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import { router, useLocalSearchParams } from 'expo-router'
import { getApiErrorMessage } from '../../../src/utils/apiError'
import type { Patient } from '../../../src/types'

const GENDER_COLORS: Record<string, string> = { Male: '#17A2B8', Female: '#DC3545', Other: '#6F42C1' }

function InfoRow({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: (color || Colors.primary) + '12' }]}>
        <Ionicons name={icon as any} size={18} color={color || Colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  )
}

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { hasRole } = useAuth()
  const patientId = Number(id)
  const canEdit = hasRole('CLINIC_STAFF', 'ADMIN')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsApi.get(patientId),
    enabled: Number.isFinite(patientId),
  })

  if (isLoading) return <Screen scroll={false}><LoadingView /></Screen>
  if (error || !data) return <Screen scroll={false}><ErrorView message={getApiErrorMessage(error)} onRetry={refetch} /></Screen>

  const patient = data as Patient
  const genderColor = GENDER_COLORS[patient.gender] || Colors.textSecondary
  const initials = patient.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <Screen>
      <PageHeader title="Patient Details" />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: genderColor + '15' }]}>
            <Text style={[styles.avatarText, { color: genderColor }]}>{initials}</Text>
          </View>
          <Text style={styles.name}>{patient.full_name}</Text>
          <Text style={styles.email}>Patient #{patient.id}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: genderColor + '15' }]}>
              <Ionicons name={patient.gender === 'Male' ? 'male' : 'female'} size={12} color={genderColor} />
              <Text style={[styles.badgeText, { color: genderColor }]}>{patient.gender}</Text>
            </View>
            {patient.age ? (
              <View style={[styles.badge, { backgroundColor: Colors.primary + '15' }]}>
                <Text style={[styles.badgeText, { color: Colors.primary }]}>{patient.age} years</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.sectionCard}>
            <InfoRow icon="call" label="Phone" value={patient.contact_phone || '—'} color="#17A2B8" />
            <View style={styles.divider} />
            <InfoRow icon="location" label="District" value={patient.district} color="#FF8C00" />
            <View style={styles.divider} />
            <InfoRow icon="people" label="Emergency Contact" value={patient.emergency_contact || '—'} color="#DC3545" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          <View style={styles.sectionCard}>
            <InfoRow icon="medical" label="Medical History" value={patient.medical_history || 'None recorded'} color="#6F42C1" />
            <View style={styles.divider} />
            <InfoRow icon="business" label="Clinic ID" value={`#${patient.clinic_id}`} color="#2D3E18" />
            <View style={styles.divider} />
            <InfoRow icon="calendar" label="Registered" value={new Date(patient.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} color={Colors.textSecondary} />
          </View>
        </View>

        {canEdit ? (
          <Button
            mode="contained"
            buttonColor={Colors.primary}
            onPress={() => router.push(`/(app)/patients/${patient.id}/edit`)}
            icon="pencil"
            style={styles.editBtn}
          >
            Edit Patient
          </Button>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  profileCard: { alignItems: 'center', paddingVertical: Spacing.lg, marginBottom: Spacing.sm },
  avatar: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  avatarText: { fontSize: 24, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: Colors.text },
  email: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  section: { marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.xs, paddingHorizontal: 4 },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },

  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, gap: Spacing.md },
  infoIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue: { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: 60 },

  editBtn: { borderRadius: 12, marginTop: Spacing.md },
})
