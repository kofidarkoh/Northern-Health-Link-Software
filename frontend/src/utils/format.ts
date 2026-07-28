import type { UserRole } from '../types'

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  CLINIC_STAFF: 'Clinic Staff',
  SPECIALIST: 'Specialist',
  LAB_OFFICER: 'Lab Officer',
  RIDER: 'Rider',
}

export function formatRole(role: UserRole | string): string {
  return ROLE_LABELS[role as UserRole] ?? role.replace(/_/g, ' ')
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateShort(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ')
}
