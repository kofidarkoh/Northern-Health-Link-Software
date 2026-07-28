import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper'
import { AuthProvider } from '../src/features/auth'
import { ErrorBoundary } from '../src/components'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet, ActivityIndicator, View, useColorScheme } from 'react-native'
import { useFonts } from 'expo-font'
import { Colors, DarkColors } from '../src/constants'

function buildTheme(isDark: boolean) {
  const c = isDark ? DarkColors : Colors
  const base = isDark ? MD3DarkTheme : MD3LightTheme

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: c.primary,
      primaryContainer: c.primaryLight,
      secondary: c.secondary,
      secondaryContainer: c.secondaryLight,
      background: c.background,
      surface: c.surface,
      surfaceVariant: c.backgroundAlt,
      onPrimary: c.white,
      onSecondary: c.text,
      onSurface: c.text,
      onBackground: c.text,
      outline: c.border,
      error: c.error,
      errorContainer: c.errorLight,
    },
    roundness: 12,
    components: {
      Button: {
        defaultProps: {
          labelStyle: { color: c.white, fontWeight: '600' },
        },
        variants: {
          contained: {
            labelStyle: { color: c.white, fontWeight: '600' },
          },
          outlined: {
            labelStyle: { color: c.primary, fontWeight: '600' },
          },
          text: {
            labelStyle: { color: c.primary, fontWeight: '600' },
          },
        },
      },
    },
  }
}

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 120000, retry: 2 } } })

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = buildTheme(isDark)

  const [fontsLoaded] = useFonts({
    Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
    MaterialCommunityIcons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
  })

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <AuthProvider>
              <StatusBar style={isDark ? 'light' : 'light'} />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
              </Stack>
            </AuthProvider>
          </PaperProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({ root: { flex: 1 }, loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background } })
