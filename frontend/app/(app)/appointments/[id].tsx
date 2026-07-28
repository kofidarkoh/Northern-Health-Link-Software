import { useState } from 'react'
import { StyleSheet, View, ScrollView } from 'react-native'
import { Text, Button } from 'react-native-paper'
import { Screen, PageHeader, LoadingView, ErrorView } from '../../../src/components'
import { clinicalApi } from '../../../src/core/api'
import { useAuth } from '../../../src/features/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import { router, useLocalSearchParams } from 'expo-router'
import { getApiErrorMessage } from '../../../src/utils/apiError'
import type { AppointmentStatus } from '../../../src/types'

const STATUS_CONFIG: Record<AppointmentStatus, { color: string; icon: string }> = {
  REQUESTED: { color: '#FFC107', icon: 'time' },
  SCHEDULED: { color: '#17A2B8', icon: 'calendar' },
  IN_PROGRESS: { color: '#FF8C00', icon: 'videocam' },
  COMPLETED: { color: '#4CAF50', icon: 'checkmark-circle' },
  CANCELLED: { color: '#DC3545', icon: 'close-circle' },
}

const STATUSES: AppointmentStatus[] = ['REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

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

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const appointmentId = Number(id)
  const { hasRole } = useAuth()
  const qc = useQueryClient()
  const [error, setError] = useState('')

  const { data, isLoading, error: fetchError, refetch } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => clinicalApi.getAppointment(appointmentId),
    enabled: Number.isFinite(appointmentId),
  })

  const appointment = data?.appointment

  const mutation = useMutation({
    mutationFn: (status: AppointmentStatus) => clinicalApi.updateAppointmentStatus(appointmentId, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); qc.invalidateQueries({ queryKey: ['appointment', appointmentId] }) },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const canUpdate = hasRole('SPECIALIST', 'ADMIN')

  if (isLoading) return <Screen scroll={false}><LoadingView /></Screen>
  if (fetchError || !appointment) return <Screen scroll={false}><ErrorView message={getApiErrorMessage(fetchError, 'Appointment not found')} onRetry={refetch} /></Screen>

  const cfg = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.REQUESTED

  return (
    <Screen>
      <PageHeader title="Appointment Details" />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={[styles.statusIcon, { backgroundColor: cfg.color + '15' }]}>
            <Ionicons name={cfg.icon as any} size={32} color={cfg.color} />
          </View>
          <Text style={styles.title}>Appointment #{appointment.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.color + '15' }]}>
            <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{appointment.status.replace('_', ' ')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Information</Text>
          <View style={styles.sectionCard}>
            <InfoRow icon="person" label="Patient" value={`#${appointment.patient_id}`} color="#DC3545" />
            <View style={styles.divider} />
            <InfoRow icon="medical" label="Specialist" value={`#${appointment.specialist_id}`} color="#2D3E18" />
            <View style={styles.divider} />
            <InfoRow icon="business" label="Clinic" value={`#${appointment.clinic_id}`} color="#17A2B8" />
            <View style={styles.divider} />
            <InfoRow icon="time" label="Scheduled" value={new Date(appointment.appointment_time).toLocaleString()} color="#FF8C00" />
            <View style={styles.divider} />
            <InfoRow icon="videocam" label="Video Room" value={appointment.video_room_url || 'Not set'} color="#6F42C1" />
            <View style={styles.divider} />
            <InfoRow icon="calendar" label="Created" value={new Date(appointment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} color={Colors.textSecondary} />
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        {canUpdate ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Update Status</Text>
            <View style={styles.statusGrid}>
              {STATUSES.map(s => {
                const sCfg = STATUS_CONFIG[s]
                return (
                  <Button
                    key={s}
                    mode="outlined"
                    icon={sCfg.icon}
                    onPress={() => mutation.mutate(s)}
                    loading={mutation.isPending && appointment.status !== s}
                    disabled={mutation.isPending}
                    style={[styles.statusBtn, { borderColor: sCfg.color + '40' }]}
                    labelStyle={{ color: sCfg.color, fontWeight: '600' }}
                    accessibilityLabel={`Set status to ${s.replace('_', ' ').toLowerCase()}`}
                  >
                    {s.replace('_', ' ')}
                  </Button>
                )
              })}
            </View>
          </View>
        ) : null}

        {hasRole('SPECIALIST') && appointment.status !== 'COMPLETED' ? (
          <Button mode="outlined" onPress={() => router.push(`/(app)/consultations/new?appointment_id=${appointment.id}`)} icon="document-text" style={styles.actionBtn} accessibilityLabel="Add consultation note">
            Add Consultation Note
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
  statusIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: Spacing.sm },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  section: { marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.xs, paddingHorizontal: 4 },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },

  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, gap: Spacing.md },
  infoIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue: { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: 60 },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.errorLight, padding: Spacing.md, borderRadius: 12, marginBottom: Spacing.md },
  error: { color: Colors.error, fontSize: 13, fontWeight: '600', flex: 1 },

  statusGrid: { gap: Spacing.sm },
  statusBtn: { borderRadius: 10 },
  actionBtn: { borderRadius: 12, marginTop: Spacing.sm },
})
