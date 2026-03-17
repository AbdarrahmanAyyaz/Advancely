import React from 'react';
import { View, Text, YStack, XStack, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Lock } from '@tamagui/lucide-icons';
import { ProgressDots } from '@/components/ProgressDots';
import { useOnboardingStore } from '@/stores/onboarding-store';

const FREE_TIER_MAX_HABITS = 3;

const CATEGORY_COLORS: Record<string, { text: string; bg: string }> = {
  skills: { text: '#5B9CF6', bg: 'rgba(91, 156, 246, 0.15)' },
  wealth: { text: '#F5A623', bg: 'rgba(245, 166, 35, 0.15)' },
  health: { text: '#34D399', bg: 'rgba(52, 211, 153, 0.15)' },
  impact: { text: '#F472B6', bg: 'rgba(244, 114, 182, 0.15)' },
};

export default function ReviewHabitsScreen(): React.JSX.Element {
  const router = useRouter();
  const { plan, selectedHabitIndices, toggleHabit, finalizePlan, isFinalizing } =
    useOnboardingStore();

  if (!plan) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0D17' }}>
        <View flex={1} justifyContent="center" alignItems="center">
          <Text color="$textSecondary">No plan generated yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleContinue = async (): Promise<void> => {
    try {
      await finalizePlan();
      router.push('/onboarding/first-mission');
    } catch (error) {
      console.error('Failed to finalize plan:', error);
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
            Daily habits
          </Text>
          <ProgressDots total={4} current={2} />
        </View>

        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <YStack paddingHorizontal="$xl" gap="$lg" paddingBottom="$xxxl">
            {/* Description */}
            <Text
              fontSize={15}
              fontWeight="400"
              color="$textSecondary"
              lineHeight={22}
            >
              These small daily habits will move you toward your goals. Toggle
              off any you'd rather skip for now.
            </Text>

            {/* Free tier limit warning */}
            {selectedHabitIndices.length >= FREE_TIER_MAX_HABITS &&
              plan.suggested_habits.length > FREE_TIER_MAX_HABITS && (
                <View
                  backgroundColor="rgba(245, 166, 35, 0.1)"
                  borderRadius={12}
                  padding="$md"
                  borderWidth={1}
                  borderColor="rgba(245, 166, 35, 0.2)"
                >
                  <XStack gap="$sm" alignItems="center">
                    <Lock size={14} color="#F5A623" />
                    <Text
                      fontSize={13}
                      fontWeight="500"
                      color="#F5A623"
                      flex={1}
                    >
                      Free plan supports {FREE_TIER_MAX_HABITS} habits. Upgrade
                      to Pro for more.
                    </Text>
                  </XStack>
                </View>
              )}

            {/* Habit Cards */}
            {plan.suggested_habits.map((habit, index) => {
              const isSelected = selectedHabitIndices.includes(index);
              const isAtLimit =
                !isSelected &&
                selectedHabitIndices.length >= FREE_TIER_MAX_HABITS;
              const colors = CATEGORY_COLORS[habit.category] ?? {
                text: '#7C5CFC',
                bg: 'rgba(124, 92, 252, 0.15)',
              };

              const handleToggle = (): void => {
                if (isAtLimit) {
                  Alert.alert(
                    'Habit Limit',
                    `Free plan supports ${FREE_TIER_MAX_HABITS} habits. Deselect one to add this, or upgrade to Pro for more.`,
                  );
                  return;
                }
                toggleHabit(index);
              };

              return (
                <Pressable
                  key={index}
                  onPress={handleToggle}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <View
                    backgroundColor="$backgroundSurface"
                    borderRadius={16}
                    padding="$lg"
                    borderWidth={1}
                    borderColor={
                      isSelected ? '$borderAccent' : '$borderDefault'
                    }
                    opacity={isSelected ? 1 : 0.5}
                  >
                    <XStack gap="$md" alignItems="flex-start">
                      {/* Checkbox */}
                      <View
                        width={24}
                        height={24}
                        borderRadius={12}
                        borderWidth={isSelected ? 0 : 1.5}
                        borderColor="$textTertiary"
                        backgroundColor={
                          isSelected ? '#34D399' : 'transparent'
                        }
                        justifyContent="center"
                        alignItems="center"
                        marginTop={2}
                        flexShrink={0}
                      >
                        {isSelected ? (
                          <Check size={14} color="#FFFFFF" />
                        ) : null}
                      </View>

                      {/* Habit Info */}
                      <YStack flex={1} gap="$xs">
                        <Text
                          fontSize={16}
                          fontWeight="600"
                          color="$textPrimary"
                          lineHeight={22}
                        >
                          {habit.name}
                        </Text>

                        {/* Category Tag */}
                        <XStack gap="$sm" alignItems="center">
                          <View
                            backgroundColor={colors.bg}
                            paddingHorizontal={10}
                            paddingVertical={3}
                            borderRadius={8}
                          >
                            <Text
                              fontSize={11}
                              fontWeight="600"
                              color={colors.text}
                              textTransform="uppercase"
                              letterSpacing={1.2}
                            >
                              {habit.category}
                            </Text>
                          </View>
                          <Text
                            fontSize={12}
                            fontWeight="500"
                            color="$textTertiary"
                          >
                            for {habit.linked_goal_title}
                          </Text>
                        </XStack>

                        <Text
                          fontSize={14}
                          fontWeight="400"
                          color="$textSecondary"
                          lineHeight={20}
                          marginTop="$xs"
                        >
                          {habit.reason}
                        </Text>
                      </YStack>
                    </XStack>
                  </View>
                </Pressable>
              );
            })}

            {/* Count */}
            <Text
              fontSize={13}
              fontWeight="500"
              color="$textTertiary"
              textAlign="center"
            >
              {selectedHabitIndices.length} of {plan.suggested_habits.length}{' '}
              habits selected
            </Text>
          </YStack>
        </ScrollView>

        {/* Continue Button */}
        <View
          paddingHorizontal="$xl"
          paddingVertical="$lg"
          borderTopWidth={1}
          borderTopColor="$borderSubtle"
        >
          <Pressable
            onPress={handleContinue}
            disabled={selectedHabitIndices.length === 0 || isFinalizing}
            style={({ pressed }) => ({
              backgroundColor:
                selectedHabitIndices.length === 0 || isFinalizing
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
            {isFinalizing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text fontSize={16} fontWeight="600" color="#FFFFFF">
                Save habits — next
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
