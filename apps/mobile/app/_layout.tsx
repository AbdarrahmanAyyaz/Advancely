import React, { useEffect, useState } from 'react';
import { useColorScheme, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider } from 'tamagui';
import { View } from 'tamagui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { tamaguiConfig } from '@/theme/tamagui.config';
import { useAuthStore } from '@/stores/auth-store';

// Prevent auto-hide of splash screen
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

/**
 * Handles auth-based routing.
 * Redirects to auth/welcome if not signed in,
 * to onboarding if signed in but not onboarded,
 * or to (tabs) if fully authenticated.
 */
function AuthGate({ children }: { children: React.ReactNode }): React.JSX.Element {
  const router = useRouter();
  const segments = useSegments();
  const { session, isLoading, isOnboarded } = useAuthStore();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboardingGroup = segments[0] === 'onboarding';

    if (!session) {
      // Not signed in — go to auth flow
      if (!inAuthGroup) {
        router.replace('/auth/welcome');
      }
    } else if (!isOnboarded) {
      // Signed in but not onboarded — go to onboarding chat
      if (!inOnboardingGroup) {
        router.replace('/onboarding/chat');
      }
    } else {
      // Fully authenticated and onboarded — go to tabs
      if (inAuthGroup || inOnboardingGroup) {
        router.replace('/(tabs)');
      }
    }

    if (!hasNavigated) {
      setHasNavigated(true);
      SplashScreen.hideAsync();
    }
  }, [session, isLoading, isOnboarded, segments]);

  // Show loading screen while auth initializes
  if (isLoading) {
    return (
      <View
        flex={1}
        backgroundColor="$background"
        justifyContent="center"
        alignItems="center"
      >
        <ActivityIndicator size="large" color="#7C5CFC" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout(): React.JSX.Element {
  const colorScheme = useColorScheme();
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider
        config={tamaguiConfig}
        defaultTheme={colorScheme === 'light' ? 'light' : 'dark'}
      >
        <AuthGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0B0D17' },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen
              name="onboarding"
              options={{ headerShown: false, gestureEnabled: false }}
            />
          </Stack>
        </AuthGate>
        <StatusBar style="light" />
      </TamaguiProvider>
    </QueryClientProvider>
  );
}
