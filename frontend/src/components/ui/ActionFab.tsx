import { StyleSheet } from 'react-native'
import { FAB } from 'react-native-paper'
import { Colors, Spacing } from '../../constants'

interface ActionFabProps {
  icon?: string
  label?: string
  onPress: () => void
  accessibilityLabel?: string
}

/**
 * Shared contextual action button for list screens.
 * Must be rendered OUTSIDE scroll content (as a sibling of <Screen>,
 * inside a flex:1 root View) so it stays pinned and never ghosts.
 */
export function ActionFab({ icon = 'plus', label, onPress, accessibilityLabel }: ActionFabProps) {
  return (
    <FAB
      icon={icon}
      label={label}
      color={Colors.white}
      theme={{ colors: { onPrimaryContainer: Colors.white } }}
      style={styles.fab}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel || label || 'Add'}
    />
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  label: { color: Colors.white, fontWeight: '700' },
})