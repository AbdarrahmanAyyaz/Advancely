import React, { useState } from 'react';
import { View, Text, YStack, XStack, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  Trophy,
  Flame,
  ChevronRight,
} from '@tamagui/lucide-icons';
import { ProgressDots } from '@/components/ProgressDots';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useAuthStore } from '@/stores/auth-store';

export default function FirstMissionScreen(): React.JSX.Element {
  const router = useRouter();
  const { plan, completeOnboarding, reset } = useOnboardingStore();
  const { setOnboarded } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await completeOnboarding();
      setOnboarded(true);
      reset();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0D17' }}>
      <View flex={1} backgroundColor="$background">
        {/* Header */}
        <View
          paddingHorizontal="$xl"
          paddingVertical="$lg"
          alignItems="center"
          gap="$md"
        >
          <Text
            fontSize={18}
            fontWeight="600"
            color="$textPrimary"
            lineHeight={24}
          >
            Your first mission
          </Text>
          <ProgressDots total={4} current={3} />
        </View>

        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <YStack paddingHorizontal="$xl" gap="$xxl" paddingBottom="$xxxl">
            {/* Celebration Card */}
            <View
              backgroundColor="$backgroundSurface"
              borderRadius={20}
              padding="$xl"
              borderWidth={1}
              borderColor="$borderAccent"
              alignItems="center"
              gap="$lg"
            >
              <View
                width={64}
                height={64}
                borderRadius={32}
                backgroundColor="$accentPrimaryMuted"
                justifyContent="center"
                alignItems="center"
              >
                <Sparkles size={32} color="$accentPrimary" />
              </View>

              <Text
                fontSize={22}
                fontWeight="700"
                color="$textPrimary"
                textAlign="center"
                lineHeight={28}
              >
                You're all set!
              </Text>

              <Text
                fontSize={15}
                fontWeight="400"
                color="$textSecondary"
                textAlign="center"
                lineHeight={22}
                maxWidth={280}
              >
                Your vision is locked in, goals are set, and habits are ready.
                Here's how it works.
              </Text>
            </View>

            {/* How it works */}
            <YStack gap="$lg">
              <Text
                fontSize={18}
                fontWeight="600"
                color="$textPrimary"
                lineHeight={24}
              >
                How Advancely works
              </Text>

              {/* Daily Tasks */}
              <View
                backgroundColor="$backgroundSurface"
                borderRadius={16}
                padding="$lg"
                borderWidth={1}
                borderColor="$borderDefault"
              >
                <XStack gap="$md" alignItems="center">
                  <View
                    width={40}
                    height={40}
                    borderRadius={12}
                    backgroundColor="rgba(91, 156, 246, 0.15)"
                    justifyContent="center"
                    alignItems="center"
                    flexShrink={0}
                  >
                    <ChevronRight size={20} color="#5B9CF6" />
                  </View>
                  <YStack flex={1} gap="$xs">
                    <Text
                      fontSize={16}
                      fontWeight="600"
                      color="$textPrimary"
                      lineHeight={22}
                    >
                      Complete daily tasks
                    </Text>
                    <Text
                      fontSize={14}
                      fontWeight="400"
                      color="$textSecondary"
                      lineHeight={20}
                    >
                      Each day you'll get AI-generated tasks aligned with your
                      goals. Complete them to earn points.
                    </Text>
                  </YStack>
                </XStack>
              </View>

              {/* Habits */}
              <View
                backgroundColor="$backgroundSurface"
                borderRadius={16}
                padding="$lg"
                borderWidth={1}
                borderColor="$borderDefault"
              >
                <XStack gap="$md" alignItems="center">
                  <View
                    width={40}
                    height={40}
                    borderRadius={12}
                    backgroundColor="rgba(245, 166, 35, 0.15)"
                    justifyContent="center"
                    alignItems="center"
                    flexShrink={0}
                  >
                    <Flame size={20} color="#F5A623" />
                  </View>
                  <YStack flex={1} gap="$xs">
                    <Text
                      fontSize={16}
                      fontWeight="600"
                      color="$textPrimary"
                      lineHeight={22}
                    >
                      Build streaks
                    </Text>
                    <Text
                      fontSize={14}
                      fontWeight="400"
                      color="$textSecondary"
                      lineHeight={20}
                    >
                      Log your habits daily to build streaks. Longer streaks
                      earn bonus points and keep you motivated.
                    </Text>
                  </YStack>
                </XStack>
              </View>

              {/* Points */}
              <View
                backgroundColor="$backgroundSurface"
                borderRadius={16}
                padding="$lg"
                borderWidth={1}
                borderColor="$borderDefault"
              >
                <XStack gap="$md" alignItems="center">
                  <View
                    width={40}
                    height={40}
                    borderRadius={12}
                    backgroundColor="rgba(124, 92, 252, 0.15)"
                    justifyContent="center"
                    alignItems="center"
                    flexShrink={0}
                  >
                    <Trophy size={20} color="#7C5CFC" />
                  </View>
                  <YStack flex={1} gap="$xs">
                    <Text
                      fontSize={16}
                      fontWeight="600"
                      color="$textPrimary"
                      lineHeight={22}
                    >
                      Level up
                    </Text>
                    <Text
                      fontSize={14}
                      fontWeight="400"
                      color="$textSecondary"
                      lineHeight={20}
                    >
                      Earn points for tasks, habits, and journaling. Watch
                      yourself advance through 10 levels.
                    </Text>
                  </YStack>
                </XStack>
              </View>
            </YStack>

            {/* Points Preview */}
            <View
              backgroundColor="$backgroundSurface"
              borderRadius={16}
              padding="$lg"
              borderWidth={1}
              borderColor="$borderDefault"
            >
              <Text
                fontSize={11}
                fontWeight="600"
                color="$textSecondary"
                textTransform="uppercase"
                letterSpacing={1.2}
                marginBottom="$md"
              >
                Points you'll earn today
              </Text>
              <YStack gap="$sm">
                <XStack justifyContent="space-between">
                  <Text fontSize={14} color="$textSecondary">
                    Complete a task
                  </Text>
                  <Text fontSize={14} fontWeight="600" color="$pointsGold">
                    +10 pts
                  </Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text fontSize={14} color="$textSecondary">
                    Log a habit
                  </Text>
                  <Text fontSize={14} fontWeight="600" color="$pointsGold">
                    +15 pts
                  </Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text fontSize={14} color="$textSecondary">
                    Journal entry
                  </Text>
                  <Text fontSize={14} fontWeight="600" color="$pointsGold">
                    +25 pts
                  </Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text fontSize={14} color="$textSecondary">
                    All tasks done bonus
                  </Text>
                  <Text fontSize={14} fontWeight="600" color="$pointsGold">
                    +20 pts
                  </Text>
                </XStack>
              </YStack>
            </View>
          </YStack>
        </ScrollView>

        {/* Start Button */}
        <View
          paddingHorizontal="$xl"
          paddingVertical="$lg"
          borderTopWidth={1}
          borderTopColor="$borderSubtle"
        >
          <Pressable
            onPress={handleStart}
            disabled={isLoading}
            style={({ pressed }) => ({
              backgroundColor: isLoading
                ? 'rgba(124, 92, 252, 0.4)'
                : pressed
                  ? 'rgba(124, 92, 252, 0.85)'
                  : '#7C5CFC',
              height: 52,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
            })}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text fontSize={16} fontWeight="600" color="#FFFFFF">
                Start my journey
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
