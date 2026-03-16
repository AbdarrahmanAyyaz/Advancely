import React from 'react';
import { View, Text, YStack, XStack, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Eye,
  Target,
  BookOpen,
  DollarSign,
  Heart,
  Users,
} from '@tamagui/lucide-icons';
import { ProgressDots } from '@/components/ProgressDots';
import { useOnboardingStore } from '@/stores/onboarding-store';

const CATEGORY_CONFIG: Record<
  string,
  { icon: typeof BookOpen; color: string; mutedColor: string; label: string }
> = {
  skills: {
    icon: BookOpen,
    color: '#5B9CF6',
    mutedColor: 'rgba(91, 156, 246, 0.15)',
    label: 'SKILLS',
  },
  wealth: {
    icon: DollarSign,
    color: '#F5A623',
    mutedColor: 'rgba(245, 166, 35, 0.15)',
    label: 'WEALTH',
  },
  health: {
    icon: Heart,
    color: '#34D399',
    mutedColor: 'rgba(52, 211, 153, 0.15)',
    label: 'HEALTH',
  },
  impact: {
    icon: Users,
    color: '#F472B6',
    mutedColor: 'rgba(244, 114, 182, 0.15)',
    label: 'IMPACT',
  },
};

export default function ReviewVisionScreen(): React.JSX.Element {
  const router = useRouter();
  const { plan } = useOnboardingStore();

  if (!plan) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0D17' }}>
        <View flex={1} justifyContent="center" alignItems="center">
          <Text color="$textSecondary">No plan generated yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            Your vision
          </Text>
          <ProgressDots total={4} current={1} />
        </View>

        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <YStack paddingHorizontal="$xl" gap="$xxl" paddingBottom="$xxxl">
            {/* Vision Card */}
            <View
              backgroundColor="$backgroundSurface"
              borderRadius={20}
              padding="$xl"
              borderWidth={1}
              borderColor="$borderAccent"
            >
              <XStack alignItems="center" gap="$sm" marginBottom="$lg">
                <View
                  width={8}
                  height={8}
                  borderRadius={4}
                  backgroundColor="$accentPrimary"
                />
                <Text
                  fontSize={11}
                  fontWeight="600"
                  color="$accentPrimary"
                  textTransform="uppercase"
                  letterSpacing={1.2}
                >
                  Your Vision
                </Text>
              </XStack>

              <Text
                fontSize={15}
                fontWeight="400"
                color="$textPrimary"
                lineHeight={22}
                fontStyle="italic"
              >
                "{plan.vision_statement}"
              </Text>
            </View>

            {/* Goals Section */}
            <YStack gap="$lg">
              <Text
                fontSize={18}
                fontWeight="600"
                color="$textPrimary"
                lineHeight={24}
              >
                Your goals
              </Text>

              {plan.goals.map((goal, index) => {
                const config = CATEGORY_CONFIG[goal.category];
                const IconComponent = config?.icon ?? Target;

                return (
                  <View
                    key={index}
                    backgroundColor="$backgroundSurface"
                    borderRadius={16}
                    padding="$lg"
                    borderWidth={1}
                    borderColor="$borderDefault"
                  >
                    <XStack gap="$md" alignItems="flex-start">
                      {/* Category Icon */}
                      <View
                        width={40}
                        height={40}
                        borderRadius={12}
                        backgroundColor={config?.mutedColor ?? 'rgba(124, 92, 252, 0.15)'}
                        justifyContent="center"
                        alignItems="center"
                        flexShrink={0}
                      >
                        <IconComponent
                          size={20}
                          color={config?.color ?? '#7C5CFC'}
                        />
                      </View>

                      {/* Goal Details */}
                      <YStack flex={1} gap="$xs">
                        <Text
                          fontSize={16}
                          fontWeight="600"
                          color="$textPrimary"
                          lineHeight={22}
                        >
                          {goal.title}
                        </Text>

                        {/* Category Tag */}
                        <View
                          alignSelf="flex-start"
                          backgroundColor={config?.mutedColor ?? 'rgba(124, 92, 252, 0.15)'}
                          paddingHorizontal={10}
                          paddingVertical={4}
                          borderRadius={8}
                        >
                          <Text
                            fontSize={11}
                            fontWeight="600"
                            color={config?.color ?? '#7C5CFC'}
                            textTransform="uppercase"
                            letterSpacing={1.2}
                          >
                            {config?.label ?? goal.category}
                          </Text>
                        </View>

                        <Text
                          fontSize={14}
                          fontWeight="400"
                          color="$textSecondary"
                          lineHeight={20}
                          marginTop="$xs"
                        >
                          {goal.description}
                        </Text>

                        <Text
                          fontSize={13}
                          fontWeight="500"
                          color="$textTertiary"
                          marginTop="$xs"
                        >
                          Year 1: {goal.year1_milestone}
                        </Text>
                      </YStack>
                    </XStack>
                  </View>
                );
              })}
            </YStack>
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
            onPress={() => router.push('/onboarding/review-habits')}
            style={({ pressed }) => ({
              backgroundColor: pressed
                ? 'rgba(124, 92, 252, 0.85)'
                : '#7C5CFC',
              height: 52,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
            })}
          >
            <Text fontSize={16} fontWeight="600" color="#FFFFFF">
              Looks great — next
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
