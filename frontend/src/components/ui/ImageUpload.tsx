import React from 'react'
import { View, StyleSheet, Image } from 'react-native'
import { Button, Text } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { useImagePicker } from '../../hooks/useImagePicker'
import { Colors, Spacing } from '../../constants'

interface ImageUploadProps {
  label?: string
  imageUri?: string | null
  onImageSelected: (uri: string, type: string, name: string) => void
  style?: any
}

export function ImageUpload({ label = 'Upload Image', imageUri, onImageSelected, style }: ImageUploadProps) {
  const { pickFromCamera, pickFromGallery } = useImagePicker()

  const handleCamera = async () => {
    const result = await pickFromCamera()
    if (result) onImageSelected(result.uri, result.type, result.name)
  }

  const handleGallery = async () => {
    const result = await pickFromGallery()
    if (result) onImageSelected(result.uri, result.type, result.name)
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
          <View style={styles.changeRow}>
            <Button mode="outlined" onPress={handleCamera} compact icon="camera">
              Camera
            </Button>
            <Button mode="outlined" onPress={handleGallery} compact icon="image">
              Gallery
            </Button>
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="image-outline" size={48} color={Colors.textTertiary} />
          <View style={styles.buttonRow}>
            <Button mode="outlined" onPress={handleCamera} compact icon="camera">
              Camera
            </Button>
            <Button mode="outlined" onPress={handleGallery} compact icon="image">
              Gallery
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  previewContainer: { gap: Spacing.xs },
  preview: { width: '100%', height: 180, borderRadius: 12, backgroundColor: Colors.border },
  changeRow: { flexDirection: 'row', gap: Spacing.sm },
  emptyContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  buttonRow: { flexDirection: 'row', gap: Spacing.sm },
})
