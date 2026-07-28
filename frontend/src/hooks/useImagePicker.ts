import * as ImagePicker from 'expo-image-picker'
import { Alert } from 'react-native'

interface PickResult {
  uri: string
  type: string
  name: string
}

export function useImagePicker() {
  const pickFromCamera = async (): Promise<PickResult | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos.')
      return null
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    })
    if (result.canceled || !result.assets[0]) return null
    const asset = result.assets[0]
    return { uri: asset.uri, type: asset.mimeType || 'image/jpeg', name: asset.fileName || `photo_${Date.now()}.jpg` }
  }

  const pickFromGallery = async (): Promise<PickResult | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery access is required to select photos.')
      return null
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    })
    if (result.canceled || !result.assets[0]) return null
    const asset = result.assets[0]
    return { uri: asset.uri, type: asset.mimeType || 'image/jpeg', name: asset.fileName || `photo_${Date.now()}.jpg` }
  }

  const pickFile = async (): Promise<PickResult | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 1,
    })
    if (result.canceled || !result.assets[0]) return null
    const asset = result.assets[0]
    return { uri: asset.uri, type: asset.mimeType || 'application/octet-stream', name: asset.fileName || `file_${Date.now()}` }
  }

  return { pickFromCamera, pickFromGallery, pickFile }
}
