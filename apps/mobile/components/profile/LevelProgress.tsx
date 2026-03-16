import React from 'react';
import { View, Text, XStack, YStack } from 'tamagui';

const LEVEL_THRESHOLDS = [
  0, 250, 750, 1500, 2500, 5000, 7000, 10000, 15000, 25000,
];

interface LevelProgressProps {
  currentLevel: number;
  totalPoints: number;
  pointsToNextLevel: number;
  levelName: string;
}

export function LevelProgress({
  currentLevel,
  totalPoints,
  pointsToNextLevel,
  levelName,
}: LevelProgressProps): React.JSX.Element {
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1] ?? 0;
  const nextThreshold =
    LEVEL_THRESHOLDS[currentLevel] ??
    LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]!;
  const levelRange = nextThreshold - currentThreshold;
  const pointsInLevel = totalPoints - currentThreshold;
  const progress =
    levelRange > 0 ? Math.min(pointsInLevel / levelRange, 1) : 1;
  const isMaxLevel = currentLevel >= LEVEL_THRESHOLDS.length;

  return (
    <View
      backgroundColor="$backgroundSurface"
      borderRadius={20}
      padding="$xl"
      borderWidth={1}
      borderColor="$borderAccent"
    >
      <YStack alignItems="center" gap="$md">
        {/* Level Circle */}
        <View
          width={72}
          height={72}
          borderRadius={36}
          backgroundColor="rgba(124, 92, 252, 0.15)"
          justifyContent="center"
          alignItems="center"
          borderWidth={2}
          borderColor="$accentPrimary"
        >
          <Text fontSize={28} fontWeight="700" color="$accentPrimary">
            {currentLevel}
          </Text>
        </View>

        {/* Level Name */}
        <Text fontSize={20} fontWeight="700" color="$textPrimary">
          {levelName}
        </Text>

        {/* Total Points */}
        <Text fontSize={14} fontWeight="500" color="$accentPrimary">
          {totalPoints.toLocaleString()} total points
        </Text>

        {/* Progress Bar */}
        {!isMaxLevel ? (
          <YStack width="100%" gap="$xs" marginTop="$sm">
            <View
              width="100%"
              height={8}
              borderRadius={9999}
              backgroundColor="$borderDefault"
              overflow="hidden"
            >
              <View
                height={8}
                borderRadius={9999}
                backgroundColor="$accentPrimary"
                width={`${Math.round(progress * 100)}%` as any}
              />
            </View>
            <XStack justifyContent="space-between">
              <Text fontSize={12} fontWeight="500" color="$textTertiary">
                {pointsInLevel} / {levelRange}
              </Text>
              <Text fontSize={12} fontWeight="500" color="$textTertiary">
                {pointsToNextLevel} to Lv.{currentLevel + 1}
              </Text>
            </XStack>
          </YStack>
        ) : (
          <Text
            fontSize={13}
            fontWeight="600"
            color="$accentPrimary"
            marginTop="$sm"
          >
            Max level reached!
          </Text>
        )}
      </YStack>
    </View>
  );
}
