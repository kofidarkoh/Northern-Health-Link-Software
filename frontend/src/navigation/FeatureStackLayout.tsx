import { Stack, Redirect, useSegments } from 'expo-router'
import { useAuth } from '../features/auth'
import { canAccessRoute } from './routes'

// Maps the first path segment under (app) to its route key in routes.ts.
// Segments not listed here (tabs, profile, unknown) are left unguarded.
const SEGMENT_TO_KEY: Record<string, string> = {
  users: 'users',
  clinics: 'clinics',
  dashboard: 'dashboard',
  'audit-logs': 'audit-logs',
  patients: 'patients',
  appointments: 'appointments',
  'lab-requests': 'lab-requests',
  deliveries: 'deliveries',
  consultations: 'consultations',
  'lab-results': 'lab-results',
  prescriptions: 'prescriptions',
  sync: 'sync',
}

export default function FeatureStackLayout() {
  const { user, isLoading } = useAuth()
  const segments = useSegments()
  const feature = segments.find((s) => !s.startsWith('(') && !s.startsWith('[')) ?? ''
  const routeKey = SEGMENT_TO_KEY[feature]

  if (!isLoading && user && routeKey && !canAccessRoute(user.role, routeKey)) {
    return <Redirect href={(user.role === 'ADMIN' ? '/(app)/dashboard' : '/(app)/(tabs)') as any} />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
