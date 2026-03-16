import React from 'react';
import { Pressable } from 'react-native';
import { View, Text, XStack } from 'tamagui';
import { Check } from '@tamagui/lucide-icons';

const CATEGORY_COLORS: Record<string, string> = {
  skills: '#5B9CF6',
  wealth: '#F5A623',
  health: '#34D399',
  impact: '#F472B6',
};

interface HabitPillProps {
  id: string;
  name: string;
  category: string;
  isCompletedToday: boolean;
  onLog: (id: string) => void;
}

export function HabitPill({
  id,
  name,
  category,
  isCompletedToday,
  onLog,
}: HabitPillProps): React.JSX.Element {
  const color = CATEGORY_COLORS[category] ?? '#7C5CFC';

  return (
    <Pressable
      onPress={() => {
        if (!isCompletedToday) {
          onLog(id);
        }
      }}
      disabled={isCompletedToday}
      style={({ pressed }) => ({
        opacity: pressed && !isCompletedToday ? 0.8 : 1,
      })}
    >
      <View
        backgroundColor="$backgroundSurface"
        borderRadius={12}
        paddingVertical="$md"
        paddingHorizontal="$lg"
        borderWidth={1}
        borderColor={isCompletedToday ? color : '$borderDefault'}
        flexDirection="row"
        alignItems="center"
        gap="$sm"
      >
        {/* Status indicator */}
        <View
          width={20}
          height={20}
          borderRadius={10}
          borderWidth={isCompletedToday ? 0 : 1.5}
          borderColor="$textTertiary"
          backgroundColor={isCompletedToday ? color : 'transparent'}
          justifyContent="center"
          alignItems="center"
          flexShrink={0}
        >
          {isCompletedToday ? <Check size={12} color="#FFFFFF" /> : null}
        </View>

        <Text
          fontSize={14}
          fontWeight="500"
          color={isCompletedToday ? '$textTertiary' : '$textPrimary'}
          numberOfLines={1}
          flexShrink={1}
        >
          {name}
        </Text>
      </View>
    </Pressable>
  );
}
