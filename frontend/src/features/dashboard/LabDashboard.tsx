import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { clinicalApi } from '../../core/api/clinicalApi'
import { RoleDashboard } from './RoleDashboard'

const ACTIONS = [
  { label: 'Lab Requests', desc: 'Incoming test orders', href: '/(app)/lab-requests', icon: 'flask' },
  { label: 'Upload Result', desc: 'Attach a report', href: '/(app)/lab-results/new', icon: 'cloud-upload' },
  { label: 'Lab Results', desc: 'Completed results', href: '/(app)/lab-results', icon: 'checkmark-done' },
]

export function LabDashboard() {
  const labRequests = useQuery({
    queryKey: ['dashboard', 'lab', 'lab-requests'],
    queryFn: () => clinicalApi.listLabRequests({ per_page: 1 }),
    refetchInterval: 60000,
  })
  const labResults = useQuery({
    queryKey: ['dashboard', 'lab', 'lab-results'],
    queryFn: () => clinicalApi.listLabResults({ per_page: 1 }),
    refetchInterval: 60000,
  })

  const loading = labRequests.isLoading || labResults.isLoading
  const onRefresh = useCallback(() => {
    void Promise.all([labRequests.refetch(), labResults.refetch()])
  }, [labRequests, labResults])

  return (
    <RoleDashboard
      title="Dashboard"
      subtitle="Laboratory Overview"
      stats={[
        { label: 'Lab Requests', value: labRequests.data?.total ?? 0, icon: 'flask' },
        { label: 'Lab Results', value: labResults.data?.total ?? 0, icon: 'checkmark-done' },
      ]}
      loading={loading}
      onRefresh={onRefresh}
      actions={ACTIONS}
    />
  )
}
