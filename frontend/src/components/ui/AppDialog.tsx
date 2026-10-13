import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { View, StyleSheet, Platform } from 'react-native'
import { Text, Button, Portal, Modal } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../constants'

export type DialogVariant = 'success' | 'error' | 'info' | 'warning'

export interface DialogAction {
  label: string
  onPress?: () => void
  mode?: 'contained' | 'outlined' | 'text'
  danger?: boolean
}

export interface DialogConfig {
  variant?: DialogVariant
  title: string
  message?: string
  actions?: DialogAction[]
  dismissible?: boolean
}

const VARIANT_META: Record<DialogVariant, { icon: string; color: string; bg: string }> = {
  success: { icon: 'checkmark-circle', color: '#2E7D32', bg: '#E8F5E9' },
  error: { icon: 'alert-circle', color: '#C62828', bg: '#FDECEA' },
  info: { icon: 'information-circle', color: '#1565C0', bg: '#E8F0FE' },
  warning: { icon: 'warning', color: '#EF6C00', bg: '#FFF4E5' },
}

// Module-level bus so non-component code (e.g. the API client) can fire dialogs.
let busListener: ((config: DialogConfig) => void) | null = null

export function showAppDialog(config: DialogConfig) {
  busListener?.(config)
}

interface DialogContextValue {
  showDialog: (config: DialogConfig) => void
  hideDialog: () => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

export function useDialog() {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialog must be used within DialogProvider')
  return ctx
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<DialogConfig | null>(null)

  const hideDialog = useCallback(() => setConfig(null), [])
  const showDialog = useCallback((next: DialogConfig) => setConfig(next), [])

  useEffect(() => {
    busListener = (next) => setConfig(next)
    return () => {
      if (busListener) busListener = null
    }
  }, [])

  const meta = VARIANT_META[config?.variant ?? 'info']

  return (
    <DialogContext.Provider value={{ showDialog, hideDialog }}>
      {children}
      <Portal>
        <Modal
          visible={config !== null}
          onDismiss={() => { if (config?.dismissible !== false) hideDialog() }}
          dismissable={config?.dismissible !== false}
          contentContainerStyle={styles.modal}
        >
          {config ? (
            <>
              <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
                <Ionicons name={meta.icon as any} size={36} color={meta.color} />
              </View>
              <Text variant="titleLarge" style={styles.title}>{config.title}</Text>
              {config.message ? <Text variant="bodyMedium" style={styles.message}>{config.message}</Text> : null}
              <View style={styles.actions}>
                {(config.actions?.length ? config.actions : [{ label: 'OK' }]).map((action, i) => (
                  <Button
                    key={i}
                    mode={action.mode ?? (i === 0 ? 'contained' : 'outlined')}
                    buttonColor={action.mode === 'outlined' || action.mode === 'text' ? undefined : action.danger ? Colors.error : Colors.primary}
                    textColor={action.mode === 'contained' ? Colors.white : action.danger ? Colors.error : Colors.primary}
                    onPress={() => { hideDialog(); action.onPress?.() }}
                    style={styles.actionBtn}
                    labelStyle={styles.actionLabel}
                  >
                    {action.label}
                  </Button>
                ))}
              </View>
            </>
          ) : null}
        </Modal>
      </Portal>
    </DialogContext.Provider>
  )
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    borderRadius: 28,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 12px 40px rgba(0, 0, 0, 0.18)', maxWidth: 420, width: '100%', alignSelf: 'center' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 40,
        elevation: 12,
      },
    }),
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: { fontWeight: '800', color: Colors.text, textAlign: 'center', letterSpacing: -0.3 },
  message: { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg, width: '100%' },
  actionBtn: { flex: 1, borderRadius: 12 },
  actionLabel: { fontWeight: '700' },
})
