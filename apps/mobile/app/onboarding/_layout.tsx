import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0B0D17' },
        gestureEnabled: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="chat" />
      <Stack.Screen name="review-vision" />
      <Stack.Screen name="review-habits" />
      <Stack.Screen name="first-mission" />
    </Stack>
  );
}
