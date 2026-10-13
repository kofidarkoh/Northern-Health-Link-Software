import type { UserRole } from '../types'

export interface AppRoute {
  key: string
  label: string
  href: string
  icon: string
  roles: UserRole[]
}

export const APP_ROUTES: AppRoute[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/(app)/dashboard',
    icon: 'stats-chart',
    roles: ['CLINIC_STAFF', 'SPECIALIST', 'LAB_OFFICER', 'RIDER'],
  },
  {
    key: 'patients',
    label: 'Patients',
    href: '/(app)/patients',
    icon: 'people',
    roles: ['CLINIC_STAFF'],
  },
  {
    key: 'appointments',
    label: 'Appointments',
    href: '/(app)/appointments',
    icon: 'calendar',
    roles: ['CLINIC_STAFF', 'SPECIALIST'],
  },
  {
    key: 'lab-requests',
    label: 'Lab Requests',
    href: '/(app)/lab-requests',
    icon: 'flask',
    roles: ['CLINIC_STAFF', 'SPECIALIST', 'LAB_OFFICER'],
  },
  {
    key: 'deliveries',
    label: 'Deliveries',
    href: '/(app)/deliveries',
    icon: 'cube',
    roles: ['CLINIC_STAFF', 'RIDER'],
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
    roles: ['SPECIALIST', 'LAB_OFFICER', 'CLINIC_STAFF'],
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
    roles: ['SPECIALIST', 'CLINIC_STAFF'],
  },
  {
    key: 'sync',
    label: 'Sync',
    href: '/(app)/sync',
    icon: 'sync',
    roles: ['CLINIC_STAFF', 'SPECIALIST', 'LAB_OFFICER', 'RIDER'],
  },
]

export function getRoutesForRole(role: UserRole): AppRoute[] {
  return APP_ROUTES.filter((r) => r.roles.includes(role))
}

export function canAccessRoute(role: UserRole, routeKey: string): boolean {
  const route = APP_ROUTES.find((r) => r.key === routeKey)
  return route ? route.roles.includes(role) : false
}
