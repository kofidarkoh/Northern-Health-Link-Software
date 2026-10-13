import { Platform, StyleSheet } from 'react-native'
import { Colors, Spacing } from './constants'

/**
 * Shared NHLS design tokens — mirrors backend/admin_ui/static/admin.css
 * so mobile and the admin web console speak the same visual language.
 */
export const Radius = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  round: 999,
} as const

export const Semantic = {
  ok: '#2E7D32',
  okBg: '#E8F5E9',
  info: '#0277BD',
  infoBg: '#E1F5FE',
  warn: '#9A6D00',
  warnBg: '#FFF8E1',
  violet: '#5E35B1',
  violetBg: '#EDE7F6',
  danger: '#C62828',
  dangerBg: '#FDECEA',
} as const

export const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#C62828',
  SPECIALIST: Colors.primary,
  CLINIC_STAFF: '#0277BD',
  LAB_OFFICER: '#9A6D00',
  RIDER: '#5E35B1',
}

export const ROLE_ICONS: Record<string, string> = {
  ADMIN: 'shield-checkmark',
  SPECIALIST: 'medical',
  CLINIC_STAFF: 'people',
  LAB_OFFICER: 'flask',
  RIDER: 'bicycle',
}

const shadow = Platform.select({
  web: { boxShadow: '0 1px 2px rgba(22,34,12,.06), 0 8px 24px rgba(22,34,12,.08)' },
  default: {
    shadowColor: '#16220C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
  },
})

/** White surface card with themed border — the admin `.card` equivalent. */
export const cardStyle = {
  backgroundColor: Colors.surface,
  borderRadius: Radius.lg,
  borderWidth: 1,
  borderColor: Colors.border,
  ...shadow,
} as const

/** Form field shell: white input, themed border, matching admin `.field/.input`. */
export const inputStyle = {
  backgroundColor: Colors.white,
} as const

export const sharedStyles = StyleSheet.create({
  card: { ...cardStyle },
  cardPad: { ...cardStyle, padding: Spacing.lg },
})
