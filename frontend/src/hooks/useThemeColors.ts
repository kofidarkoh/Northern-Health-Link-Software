import { useColorScheme } from 'react-native'
import { Colors, DarkColors } from '../constants'

export function useThemeColors() {
  const colorScheme = useColorScheme()
  return colorScheme === 'dark' ? DarkColors : Colors
}
