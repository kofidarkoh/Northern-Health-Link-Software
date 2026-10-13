import type { UserRole } from '../types'

/** Brand color per role — used for badge tint backgrounds, avatars, accents. */
export const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: '#DC3545',
  SPECIALIST: '#2D3E18',
  CLINIC_STAFF: '#17A2B8',
  LAB_OFFICER: '#FFC107',
  RIDER: '#6F42C1',
}

/**
 * Darkened variants for badge TEXT.
 * Bright hues (amber/teal) fail contrast as text on their own 15% tint,
 * so text uses these while the background keeps the brand color.
 */
export const ROLE_TEXT_COLORS: Record<UserRole, string> = {
  ADMIN: '#B02A37',
  SPECIALIST: '#2D3E18',
  CLINIC_STAFF: '#0E7586',
  LAB_OFFICER: '#8A6D00',
  RIDER: '#5F38A6',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  CLINIC_STAFF: 'Clinic Staff',
  SPECIALIST: 'Specialist',
  LAB_OFFICER: 'Lab Officer',
  RIDER: 'Rider',
}

export const ROLE_ICONS: Record<UserRole, string> = {
  ADMIN: 'shield-checkmark',
  SPECIALIST: 'medical',
  CLINIC_STAFF: 'people',
  LAB_OFFICER: 'flask',
  RIDER: 'bicycle',
}

export const ROLES: UserRole[] = ['ADMIN', 'CLINIC_STAFF', 'SPECIALIST', 'LAB_OFFICER', 'RIDER']
