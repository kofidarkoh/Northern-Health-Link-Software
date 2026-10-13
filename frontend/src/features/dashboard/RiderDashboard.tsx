import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { deliveriesApi } from '../../core/api/deliveriesApi'
import { RoleDashboard } from './RoleDashboard'

const ACTIONS = [
  { label: 'My Deliveries', desc: 'Pickups & dropoffs', href: '/(app)/deliveries', icon: 'bicycle' },
]

export function RiderDashboard() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', 'rider', 'deliveries'],
    queryFn: () => deliveriesApi.list({ per_page: 1 }),
    refetchInterval: 60000,
  })

  const onRefresh = useCallback(() => {
    void refetch()
  }, [refetch])

  return (
    <RoleDashboard
      title="Dashboard"
      subtitle="Dispatch Overview"
      stats={[{ label: 'My Deliveries', value: data?.total ?? 0, icon: 'bicycle' }]}
      loading={isLoading}
      onRefresh={onRefresh}
      actions={ACTIONS}
    />
  )
}
