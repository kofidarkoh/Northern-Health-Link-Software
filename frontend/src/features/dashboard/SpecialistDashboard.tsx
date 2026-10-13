import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { clinicalApi } from '../../core/api/clinicalApi'
import { prescriptionsApi } from '../../core/api/prescriptionsApi'
import { RoleDashboard } from './RoleDashboard'

const ACTIONS = [
  { label: 'Appointments', desc: 'My schedule', href: '/(app)/appointments', icon: 'calendar' },
  { label: 'New Consultation', desc: 'Notes & diagnosis', href: '/(app)/consultations/new', icon: 'document-text' },
  { label: 'Prescriptions', desc: 'Medication orders', href: '/(app)/prescriptions', icon: 'medkit' },
  { label: 'Lab Results', desc: 'View test results', href: '/(app)/lab-results', icon: 'flask' },
]

export function SpecialistDashboard() {
  const appointments = useQuery({
    queryKey: ['dashboard', 'specialist', 'appointments'],
    queryFn: () => clinicalApi.listAppointments({ per_page: 1 }),
    refetchInterval: 60000,
  })
  const prescriptions = useQuery({
    queryKey: ['dashboard', 'specialist', 'prescriptions'],
    queryFn: () => prescriptionsApi.list({ per_page: 1 }),
    refetchInterval: 60000,
  })
  const labResults = useQuery({
    queryKey: ['dashboard', 'specialist', 'lab-results'],
    queryFn: () => clinicalApi.listLabResults({ per_page: 1 }),
    refetchInterval: 60000,
  })

  const loading = appointments.isLoading || prescriptions.isLoading || labResults.isLoading
  const onRefresh = useCallback(() => {
    void Promise.all([appointments.refetch(), prescriptions.refetch(), labResults.refetch()])
  }, [appointments, prescriptions, labResults])

  return (
    <RoleDashboard
      title="Dashboard"
      subtitle="Practice Overview"
      stats={[
        { label: 'Appointments', value: appointments.data?.total ?? 0, icon: 'calendar' },
        { label: 'Prescriptions', value: prescriptions.data?.total ?? 0, icon: 'medkit' },
        { label: 'Lab Results', value: labResults.data?.total ?? 0, icon: 'flask' },
      ]}
      loading={loading}
      onRefresh={onRefresh}
      actions={ACTIONS}
    />
  )
}
