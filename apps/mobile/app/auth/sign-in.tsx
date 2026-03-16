import React, { useState } from 'react';
import { View, Text, YStack, Input } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { ArrowLeft } from '@tamagui/lucide-icons';
import { useAuthStore } from '@/stores/auth-store';

export default function SignInScreen(): React.JSX.Element {
  const router = useRouter();
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = email.includes('@') && password.length >= 6;

  const handleSignIn = async (): Promise<void> => {
    if (!isValid || isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      await signInWithEmail(email.trim().toLowerCase(), password);
      // Auth state listener in the store will handle navigation
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Sign in failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0D17' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View flex={1} padding="$xl" backgroundColor="$background">
            {/* Back button */}
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 44,
                height: 44,
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: -8,
              }}
            >
              <ArrowLeft size={24} color="#E8E8ED" />
            </Pressable>

            {/* Header */}
            <YStack gap="$sm" marginTop="$xxl">
              <Text
                fontSize={28}
                fontWeight="700"
                color="$textPrimary"
                lineHeight={34}
              >
                Welcome back
              </Text>
              <Text
                fontSize={15}
                fontWeight="400"
                color="$textSecondary"
                lineHeight={22}
              >
                Sign in to continue your journey.
              </Text>
            </YStack>

            {/* Form */}
            <YStack gap="$lg" marginTop="$xxxl">
              {/* Email */}
              <YStack gap="$sm">
                <Text
                  fontSize={13}
                  fontWeight="600"
                  color="$textSecondary"
                  textTransform="uppercase"
                  letterSpacing={1}
                >
                  Email
                </Text>
                <Input
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#555873"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  size="$lg"
                  height={52}
                  backgroundColor="$backgroundInput"
                  borderColor="$borderDefault"
                  borderWidth={1}
                  borderRadius={12}
                  color="$textPrimary"
                  fontSize={15}
                  paddingHorizontal="$lg"
                  focusStyle={{
                    borderColor: '$borderFocused',
                  }}
                />
              </YStack>

              {/* Password */}
              <YStack gap="$sm">
                <Text
                  fontSize={13}
                  fontWeight="600"
                  color="$textSecondary"
                  textTransform="uppercase"
                  letterSpacing={1}
                >
                  Password
                </Text>
                <Input
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  placeholderTextColor="#555873"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                  size="$lg"
                  height={52}
                  backgroundColor="$backgroundInput"
                  borderColor="$borderDefault"
                  borderWidth={1}
                  borderRadius={12}
                  color="$textPrimary"
                  fontSize={15}
                  paddingHorizontal="$lg"
                  focusStyle={{
                    borderColor: '$borderFocused',
                  }}
                />
              </YStack>

              {/* Error message */}
              {error ? (
                <Text fontSize={14} fontWeight="500" color="$error">
                  {error}
                </Text>
              ) : null}

              {/* Sign In button */}
              <Pressable
                onPress={handleSignIn}
                disabled={!isValid || isLoading}
                style={({ pressed }) => ({
                  backgroundColor:
                    !isValid || isLoading
                      ? 'rgba(124, 92, 252, 0.4)'
                      : pressed
                        ? 'rgba(124, 92, 252, 0.85)'
                        : '#7C5CFC',
                  height: 52,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 8,
                })}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text fontSize={16} fontWeight="600" color="#FFFFFF">
                    Sign in
                  </Text>
                )}
              </Pressable>
            </YStack>

            {/* Bottom link */}
            <View flex={1} justifyContent="flex-end" paddingBottom="$lg">
              <Pressable
                onPress={() => {
                  router.back();
                  router.push('/auth/sign-up');
                }}
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingVertical: 8,
                }}
              >
                <Text fontSize={14} fontWeight="400" color="$textSecondary">
                  Don't have an account?{' '}
                  <Text fontSize={14} fontWeight="600" color="#7C5CFC">
                    Sign up
                  </Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
