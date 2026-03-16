import React from 'react';
import { View, Text, XStack, YStack } from 'tamagui';
import { Pressable } from 'react-native';

const MOODS: { value: number; label: string }[] = [
  { value: 1, label: 'Rough' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Great' },
];

const MOOD_COLORS: Record<number, string> = {
  1: '#EF4444',
  2: '#F59E0B',
  3: '#8B8FA3',
  4: '#5B9CF6',
  5: '#34D399',
};

interface MoodSelectorProps {
  value: number | null;
  onChange: (mood: number) => void;
}

export function MoodSelector({
  value,
  onChange,
}: MoodSelectorProps): React.JSX.Element {
  return (
    <YStack gap="$sm">
      <Text
        fontSize={11}
        fontWeight="600"
        color="$textSecondary"
        textTransform="uppercase"
        letterSpacing={1.2}
      >
        How are you feeling?
      </Text>

      <XStack justifyContent="space-between" paddingVertical="$sm">
        {MOODS.map((mood) => {
          const isSelected = value === mood.value;
          const color = MOOD_COLORS[mood.value] ?? '#7C5CFC';

          return (
            <Pressable
              key={mood.value}
              onPress={() => onChange(mood.value)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                alignItems: 'center',
              })}
            >
              <YStack alignItems="center" gap="$xs">
                <View
                  width={44}
                  height={44}
                  borderRadius={22}
                  backgroundColor={isSelected ? color : '#1E2030'}
                  borderWidth={isSelected ? 0 : 1}
                  borderColor="$borderDefault"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text
                    fontSize={16}
                    fontWeight="700"
                    color={isSelected ? '#FFFFFF' : '$textTertiary'}
                  >
                    {mood.value}
                  </Text>
                </View>
                <Text
                  fontSize={11}
                  fontWeight="500"
                  color={isSelected ? color : '$textTertiary'}
                >
                  {mood.label}
                </Text>
              </YStack>
            </Pressable>
          );
        })}
      </XStack>
    </YStack>
  );
}
