import { Alert, Platform } from 'react-native'

export function showToast(title: string, message: string) {
  if (Platform.OS === 'web') {
    console.warn(`${title}: ${message}`)
    return
  }
  Alert.alert(title, message)
}
