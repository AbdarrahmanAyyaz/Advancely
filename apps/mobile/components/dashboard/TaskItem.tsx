import React, { useRef, useCallback } from 'react';
import { Animated, Pressable } from 'react-native';
import { View, Text, YStack, XStack } from 'tamagui';
import { Check } from '@tamagui/lucide-icons';

const CATEGORY_COLORS: Record<string, { text: string; bg: string }> = {
  skills: { text: '#5B9CF6', bg: 'rgba(91, 156, 246, 0.15)' },
  wealth: { text: '#F5A623', bg: 'rgba(245, 166, 35, 0.15)' },
  health: { text: '#34D399', bg: 'rgba(52, 211, 153, 0.15)' },
  impact: { text: '#F472B6', bg: 'rgba(244, 114, 182, 0.15)' },
};

interface TaskItemProps {
  id: string;
  title: string;
  isCompleted: boolean;
  category?: string;
  onComplete: (id: string) => void;
}

export function TaskItem({
  id,
  title,
  isCompleted,
  category,
  onComplete,
}: TaskItemProps): React.JSX.Element {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    if (isCompleted) return;

    // Scale animation per DESIGN_SYSTEM.md: 0.9 → 1.0, 300ms, ease-out
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    onComplete(id);
  }, [id, isCompleted, onComplete]);

  const colors = category ? CATEGORY_COLORS[category] : undefined;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable onPress={handlePress} disabled={isCompleted}>
        <View
          backgroundColor="$backgroundSurface"
          borderRadius={16}
          paddingVertical={14}
          paddingHorizontal="$lg"
          borderWidth={1}
          borderColor="$borderDefault"
        >
          <XStack gap="$md" alignItems="flex-start">
            {/* Checkbox */}
            <View
              width={24}
              height={24}
              borderRadius={12}
              borderWidth={isCompleted ? 0 : 1.5}
              borderColor="$textTertiary"
              backgroundColor={isCompleted ? '#34D399' : 'transparent'}
              justifyContent="center"
              alignItems="center"
              marginTop={1}
              flexShrink={0}
            >
              {isCompleted ? <Check size={14} color="#FFFFFF" /> : null}
            </View>

            {/* Task content */}
            <YStack flex={1} gap={6}>
              <Text
                fontSize={16}
                fontWeight="600"
                color={isCompleted ? '$textTertiary' : '$textPrimary'}
                lineHeight={22}
                textDecorationLine={isCompleted ? 'line-through' : 'none'}
              >
                {title}
              </Text>

              {/* Category tag */}
              {colors && category ? (
                <View
                  alignSelf="flex-start"
                  backgroundColor={colors.bg}
                  paddingHorizontal={10}
                  paddingVertical={4}
                  borderRadius={8}
                >
                  <Text
                    fontSize={11}
                    fontWeight="600"
                    color={colors.text}
                    textTransform="uppercase"
                    letterSpacing={1.2}
                  >
                    {category}
                  </Text>
                </View>
              ) : null}
            </YStack>
          </XStack>
        </View>
      </Pressable>
    </Animated.View>
  );
}
