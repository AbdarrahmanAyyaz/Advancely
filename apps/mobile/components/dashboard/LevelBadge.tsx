import React from 'react';
import { Pressable } from 'react-native';
import { View, Text, XStack } from 'tamagui';
import { TrendingUp } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';

interface LevelBadgeProps {
  level: number;
  totalPoints: number;
}

export function LevelBadge({
  level,
  totalPoints,
}: LevelBadgeProps): React.JSX.Element {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push('/(tabs)/profile')}>
      <View
        backgroundColor="$backgroundSurface"
        borderRadius={9999}
        paddingVertical={6}
        paddingHorizontal={14}
        borderWidth={1}
        borderColor="$borderDefault"
      >
        <XStack alignItems="center" gap="$sm">
          <TrendingUp size={14} color="$accentPrimary" />
          <Text fontSize={13} fontWeight="600" color="$accentPrimary">
            Lv.{level}
          </Text>
          <Text fontSize={12} fontWeight="600" color="$textPrimary">
            {totalPoints} pts
          </Text>
        </XStack>
      </View>
    </Pressable>
  );
}
