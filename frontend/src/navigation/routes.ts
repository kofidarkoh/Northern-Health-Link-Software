import type { UserRole } from '../types'

export interface AppRoute {
  key: string
  label: string
  href: string
  icon: string
  roles: UserRole[]
}

export const APP_ROUTES: AppRoute[] = [
  { key: 'users', label: 'Users', href: '/(app)/users', icon: 'people', roles: ['ADMIN'] },
  { key: 'clinics', label: 'Clinics', href: '/(app)/clinics', icon: 'business', roles: ['ADMIN'] },
  { key: 'dashboard', label: 'Dashboard', href: '/(app)/dashboard', icon: 'stats-chart', roles: ['ADMIN'] },
  { key: 'audit-logs', label: 'Audit Logs', href: '/(app)/audit-logs', icon: 'document-text', roles: ['ADMIN'] },
  { key: 'patients', label: 'Patients', href: '/(app)/patients', icon: 'people', roles: ['CLINIC_STAFF', 'ADMIN'] },
  {
    key: 'appointments',
    label: 'Appointments',
    href: '/(app)/appointments',
    icon: 'calendar',
    roles: ['CLINIC_STAFF', 'SPECIALIST', 'ADMIN'],
  },
  {
    key: 'lab-requests',
    label: 'Lab Requests',
    href: '/(app)/lab-requests',
    icon: 'flask',
    roles: ['CLINIC_STAFF', 'SPECIALIST', 'LAB_OFFICER', 'ADMIN'],
  },
  {
    key: 'deliveries',
    label: 'Deliveries',
    href: '/(app)/deliveries',
    icon: 'cube',
    roles: ['CLINIC_STAFF', 'RIDER', 'ADMIN'],
  },
  {
    key: 'consultations',
    label: 'Consultations',
    href: '/(app)/consultations/new',
    icon: 'chatbubbles',
    roles: ['SPECIALIST'],
  },
  {
    key: 'lab-results',
    label: 'Lab Results',
    href: '/(app)/lab-results',
    icon: 'flask',
    roles: ['SPECIALIST', 'LAB_OFFICER', 'CLINIC_STAFF', 'ADMIN'],
  },
  {
    key: 'lab-upload',
    label: 'Upload Results',
    href: '/(app)/lab-results/new',
    icon: 'camera',
    roles: ['LAB_OFFICER'],
  },
  {
    key: 'prescriptions',
    label: 'Prescriptions',
    href: '/(app)/prescriptions',
    icon: 'medical',
    roles: ['SPECIALIST', 'CLINIC_STAFF', 'ADMIN'],
  },
  {
    key: 'sync',
    label: 'Sync',
    href: '/(app)/sync',
    icon: 'sync',
    roles: ['ADMIN', 'CLINIC_STAFF', 'SPECIALIST', 'LAB_OFFICER', 'RIDER'],
  },
]

export function getRoutesForRole(role: UserRole): AppRoute[] {
  return APP_ROUTES.filter((r) => r.roles.includes(role))
}

export function canAccessRoute(role: UserRole, routeKey: string): boolean {
  const route = APP_ROUTES.find((r) => r.key === routeKey)
  return route ? route.roles.includes(role) : false
}
