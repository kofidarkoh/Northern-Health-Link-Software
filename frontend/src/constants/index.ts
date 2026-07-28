export const Colors = {
  primary: '#2D3E18',
  primaryLight: '#4A5F2E',
  primaryDark: '#1E2A10',
  secondary: '#FFC107',
  secondaryLight: '#FFD54F',
  secondaryDark: '#FFB300',
  background: '#FFFFFF',
  backgroundAlt: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  border: '#E9ECEF',
  error: '#DC3545',
  errorLight: '#F8D7DA',
  success: '#2D3E18',
  successLight: '#D4EDDA',
  warning: '#FFC107',
  white: '#FFFFFF',
  black: '#000000',
  textTertiary: '#ADB5BD',
  shadow: 'rgba(0, 0, 0, 0.08)',
}

export const DarkColors = {
  primary: '#4A5F2E',
  primaryLight: '#6B8A3E',
  primaryDark: '#2D3E18',
  secondary: '#FFD54F',
  secondaryLight: '#FFE082',
  secondaryDark: '#FFC107',
  background: '#121212',
  backgroundAlt: '#1E1E1E',
  surface: '#1E1E1E',
  text: '#F5F5F5',
  textSecondary: '#B0B0B0',
  textLight: '#757575',
  border: '#2C2C2C',
  error: '#EF5350',
  errorLight: '#3D1A1A',
  success: '#6B8A3E',
  successLight: '#1A2D10',
  warning: '#FFD54F',
  white: '#FFFFFF',
  black: '#000000',
  textTertiary: '#757575',
  shadow: 'rgba(0, 0, 0, 0.3)',
}

export function getColors(isDark: boolean) {
  return isDark ? DarkColors : Colors
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const Layout = {
  maxContentWidth: 960,
  tabletMinWidth: 768,
}
