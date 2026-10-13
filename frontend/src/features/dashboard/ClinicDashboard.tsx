import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { patientsApi } from '../../core/api/patientsApi'
import { clinicalApi } from '../../core/api/clinicalApi'
import { prescriptionsApi } from '../../core/api/prescriptionsApi'
import { RoleDashboard } from './RoleDashboard'

const ACTIONS = [
  { label: 'Patients', desc: 'Patient records', href: '/(app)/patients', icon: 'accessibility' },
  { label: 'New Appointment', desc: 'Schedule a visit', href: '/(app)/appointments/new', icon: 'calendar' },
  { label: 'Lab Requests', desc: 'Test orders', href: '/(app)/lab-requests', icon: 'flask' },
  { label: 'Prescriptions', desc: 'Medication orders', href: '/(app)/prescriptions', icon: 'medkit' },
  { label: 'Deliveries', desc: 'Track dispatches', href: '/(app)/deliveries', icon: 'cube' },
]

export function ClinicDashboard() {
  const patients = useQuery({
    queryKey: ['dashboard', 'clinic', 'patients'],
    queryFn: () => patientsApi.list({ per_page: 1 }),
    refetchInterval: 60000,
  })
  const appointments = useQuery({
    queryKey: ['dashboard', 'clinic', 'appointments'],
    queryFn: () => clinicalApi.listAppointments({ per_page: 1 }),
    refetchInterval: 60000,
  })
  const labRequests = useQuery({
    queryKey: ['dashboard', 'clinic', 'lab-requests'],
    queryFn: () => clinicalApi.listLabRequests({ per_page: 1 }),
    refetchInterval: 60000,
  })
  const prescriptions = useQuery({
    queryKey: ['dashboard', 'clinic', 'prescriptions'],
    queryFn: () => prescriptionsApi.list({ per_page: 1 }),
    refetchInterval: 60000,
  })

  const loading = patients.isLoading || appointments.isLoading || labRequests.isLoading || prescriptions.isLoading
  const onRefresh = useCallback(() => {
    void Promise.all([patients.refetch(), appointments.refetch(), labRequests.refetch(), prescriptions.refetch()])
  }, [patients, appointments, labRequests, prescriptions])

  return (
    <RoleDashboard
      title="Dashboard"
      subtitle="Clinic Overview"
      stats={[
        { label: 'Patients', value: patients.data?.total ?? 0, icon: 'accessibility' },
        { label: 'Appointments', value: appointments.data?.total ?? 0, icon: 'calendar' },
        { label: 'Lab Requests', value: labRequests.data?.total ?? 0, icon: 'flask' },
        { label: 'Prescriptions', value: prescriptions.data?.total ?? 0, icon: 'medkit' },
      ]}
      loading={loading}
      onRefresh={onRefresh}
      actions={ACTIONS}
    />
  )
}
