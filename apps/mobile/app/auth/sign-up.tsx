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

export default function SignUpScreen(): React.JSX.Element {
  const router = useRouter();
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordsMatch = password === confirmPassword;
  const isValid =
    email.includes('@') && password.length >= 8 && passwordsMatch;

  const getPasswordStrength = (): {
    label: string;
    color: string;
    width: string;
  } => {
    if (password.length === 0)
      return { label: '', color: 'transparent', width: '0%' };
    if (password.length < 6)
      return { label: 'Too short', color: '#F87171', width: '20%' };
    if (password.length < 8)
      return { label: 'Weak', color: '#FBBF24', width: '40%' };

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const variety = [hasUpper, hasLower, hasNumber, hasSpecial].filter(
      Boolean,
    ).length;

    if (variety >= 3 && password.length >= 10)
      return { label: 'Strong', color: '#34D399', width: '100%' };
    if (variety >= 2)
      return { label: 'Fair', color: '#FBBF24', width: '60%' };
    return { label: 'Weak', color: '#FBBF24', width: '40%' };
  };

  const strength = getPasswordStrength();

  const handleSignUp = async (): Promise<void> => {
    if (!isValid || isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      await signUpWithEmail(email.trim().toLowerCase(), password);
      // Auth state listener in the store will handle navigation
    } catch (err) {
      let message = 'Sign up failed. Please try again.';
      if (err instanceof Error) {
        // Supabase rate limit (429) — give a friendly message
        if (err.message.includes('rate') || err.message.includes('429') || err.message.includes('too many')) {
          message = 'Too many sign-up attempts. Please wait a few minutes and try again.';
        } else {
          message = err.message;
        }
      }
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
                Create your account
              </Text>
              <Text
                fontSize={15}
                fontWeight="400"
                color="$textSecondary"
                lineHeight={22}
              >
                Start your personal development journey.
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
                  placeholder="Minimum 8 characters"
                  placeholderTextColor="#555873"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
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
                {/* Password strength indicator */}
                {password.length > 0 ? (
                  <YStack gap="$xs">
                    <View
                      height={3}
                      borderRadius={2}
                      backgroundColor="$borderDefault"
                      overflow="hidden"
                    >
                      <View
                        height={3}
                        borderRadius={2}
                        backgroundColor={strength.color}
                        width={strength.width as any}
                      />
                    </View>
                    <Text fontSize={12} fontWeight="500" color={strength.color}>
                      {strength.label}
                    </Text>
                  </YStack>
                ) : null}
              </YStack>

              {/* Confirm Password */}
              <YStack gap="$sm">
                <Text
                  fontSize={13}
                  fontWeight="600"
                  color="$textSecondary"
                  textTransform="uppercase"
                  letterSpacing={1}
                >
                  Confirm password
                </Text>
                <Input
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#555873"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
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
                {confirmPassword.length > 0 && !passwordsMatch ? (
                  <Text fontSize={12} fontWeight="500" color="$error">
                    Passwords don't match
                  </Text>
                ) : null}
              </YStack>

              {/* Error message */}
              {error ? (
                <Text fontSize={14} fontWeight="500" color="$error">
                  {error}
                </Text>
              ) : null}

              {/* Sign Up button */}
              <Pressable
                onPress={handleSignUp}
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
                    Create account
                  </Text>
                )}
              </Pressable>
            </YStack>

            {/* Terms */}
            <View paddingTop="$lg">
              <Text
                fontSize={12}
                fontWeight="400"
                color="$textTertiary"
                textAlign="center"
                lineHeight={18}
              >
                By creating an account, you agree to our Terms of Service and
                Privacy Policy.
              </Text>
            </View>

            {/* Bottom link */}
            <View flex={1} justifyContent="flex-end" paddingBottom="$lg">
              <Pressable
                onPress={() => {
                  router.back();
                  router.push('/auth/sign-in');
                }}
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
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
