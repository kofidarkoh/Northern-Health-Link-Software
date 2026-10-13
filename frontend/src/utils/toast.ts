import { Platform } from 'react-native'
import { showAppDialog } from '../components/ui/AppDialog'

export function showToast(title: string, message: string) {
  if (Platform.OS === 'web') {
    console.warn(`${title}: ${message}`)
    return
  }
  showAppDialog({ variant: 'warning', title, message })
}
