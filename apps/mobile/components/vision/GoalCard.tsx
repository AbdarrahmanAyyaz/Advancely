import React from 'react';
import { View, Text, XStack, YStack } from 'tamagui';
import {
  BookOpen,
  DollarSign,
  Heart,
  Users,
} from '@tamagui/lucide-icons';
import type { Milestone } from '@/hooks/use-vision';

const CATEGORY_CONFIG: Record<
  string,
  {
    icon: typeof BookOpen;
    color: string;
    mutedColor: string;
    label: string;
  }
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

interface GoalCardProps {
  title: string;
  category: string;
  description: string | null;
  progress: number;
  milestones: Milestone[];
}

export function GoalCard({
  title,
  category,
  description,
  progress,
  milestones,
}: GoalCardProps): React.JSX.Element {
  const config = CATEGORY_CONFIG[category];
  const IconComponent = config?.icon ?? BookOpen;
  const color = config?.color ?? '#7C5CFC';
  const mutedColor = config?.mutedColor ?? 'rgba(124, 92, 252, 0.15)';

  const year1Milestone = milestones.find((m) => m.year === 1);

  return (
    <View
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
          backgroundColor={mutedColor}
          justifyContent="center"
          alignItems="center"
          flexShrink={0}
        >
          <IconComponent size={20} color={color} />
        </View>

        {/* Goal Details */}
        <YStack flex={1} gap="$sm">
          {/* Title */}
          <Text
            fontSize={16}
            fontWeight="600"
            color="$textPrimary"
            lineHeight={22}
          >
            {title}
          </Text>

          {/* Progress Bar */}
          <XStack alignItems="center" gap="$sm">
            <View
              flex={1}
              height={6}
              borderRadius={9999}
              backgroundColor="$borderDefault"
              overflow="hidden"
            >
              <View
                height={6}
                borderRadius={9999}
                backgroundColor={color}
                width={`${Math.min(progress, 100)}%` as any}
              />
            </View>
            <Text fontSize={12} fontWeight="500" color={color}>
              {progress}%
            </Text>
          </XStack>

          {/* Year 1 Milestone */}
          {year1Milestone ? (
            <Text
              fontSize={14}
              fontWeight="400"
              color="$textTertiary"
              lineHeight={20}
            >
              Year 1: {year1Milestone.target}
            </Text>
          ) : null}

          {/* Description (if no milestone) */}
          {!year1Milestone && description ? (
            <Text
              fontSize={14}
              fontWeight="400"
              color="$textSecondary"
              lineHeight={20}
              numberOfLines={2}
            >
              {description}
            </Text>
          ) : null}
        </YStack>
      </XStack>
    </View>
  );
}
