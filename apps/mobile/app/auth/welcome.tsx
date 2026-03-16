import React from 'react';
import { View, Text, YStack, XStack } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { Sparkles } from '@tamagui/lucide-icons';

export default function WelcomeScreen(): React.JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0D17' }}>
      <View flex={1} padding="$xl" backgroundColor="$background">
        {/* Top spacer + branding */}
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$lg">
          {/* AI Accent Icon */}
          <View
            width={72}
            height={72}
            borderRadius={20}
            backgroundColor="$accentPrimaryMuted"
            justifyContent="center"
            alignItems="center"
            marginBottom="$md"
          >
            <Sparkles size={36} color="$accentPrimary" />
          </View>

          {/* Title */}
          <Text
            fontSize={32}
            fontWeight="700"
            color="$textPrimary"
            textAlign="center"
            lineHeight={38}
          >
            Advancely Ai
          </Text>

          {/* Subtitle */}
          <Text
            fontSize={15}
            fontWeight="400"
            color="$textSecondary"
            textAlign="center"
            maxWidth={300}
            lineHeight={22}
          >
            Your AI-powered personal development companion.{'\n'}
            Define your vision, build your plan, and advance every day.
          </Text>
        </YStack>

        {/* Bottom Actions */}
        <YStack gap="$md" paddingBottom="$lg">
          {/* Continue with Apple - Primary white button */}
          <Pressable
            onPress={() => {
              // Apple Sign In — will be configured when Apple Developer account is ready
            }}
            style={({ pressed }) => ({
              backgroundColor: pressed
                ? 'rgba(255, 255, 255, 0.85)'
                : '#FFFFFF',
              height: 52,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              gap: 8,
            })}
          >
            <Text fontSize={16} fontWeight="600" color="#0B0D17">
               Continue with Apple
            </Text>
          </Pressable>

          {/* Continue with Google - Outlined button */}
          <Pressable
            onPress={() => {
              // Google Sign In — will be configured later
            }}
            style={({ pressed }) => ({
              backgroundColor: pressed
                ? 'rgba(255, 255, 255, 0.05)'
                : 'transparent',
              height: 52,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.08)',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              gap: 8,
            })}
          >
            <Text fontSize={16} fontWeight="600" color="#E8E8ED">
              Continue with Google
            </Text>
          </Pressable>

          {/* Divider */}
          <XStack alignItems="center" gap="$md" marginVertical="$sm">
            <View flex={1} height={1} backgroundColor="$borderDefault" />
            <Text fontSize={13} fontWeight="500" color="$textTertiary">
              or
            </Text>
            <View flex={1} height={1} backgroundColor="$borderDefault" />
          </XStack>

          {/* Sign up with email - Ghost button */}
          <Pressable
            onPress={() => router.push('/auth/sign-up')}
            style={({ pressed }) => ({
              height: 52,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text fontSize={16} fontWeight="600" color="#7C5CFC">
              Sign up with email
            </Text>
          </Pressable>

          {/* Already have an account */}
          <Pressable
            onPress={() => router.push('/auth/sign-in')}
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 8,
            }}
          >
            <Text fontSize={14} fontWeight="400" color="$textSecondary">
              Already have an account?{' '}
              <Text fontSize={14} fontWeight="600" color="#7C5CFC">
                Sign in
              </Text>
            </Text>
          </Pressable>
        </YStack>
      </View>
    </SafeAreaView>
  );
}
