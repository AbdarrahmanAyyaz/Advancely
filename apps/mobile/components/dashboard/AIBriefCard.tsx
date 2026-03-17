import React from 'react';
import { View, Text } from 'tamagui';
import { ActivityIndicator } from 'react-native';
import { Sparkles } from '@tamagui/lucide-icons';

interface AIBriefCardProps {
  brief: string | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function AIBriefCard({
  brief,
  isLoading,
  isError,
}: AIBriefCardProps): React.JSX.Element {
  return (
    <View
      backgroundColor="$backgroundSurface"
      borderRadius={20}
      padding="$lg"
      borderWidth={1}
      borderColor="$borderDefault"
      borderLeftWidth={3}
      borderLeftColor="$accentPrimary"
    >
      {isLoading ? (
        <View
          flexDirection="row"
          alignItems="center"
          gap="$sm"
          paddingVertical="$sm"
        >
          <Sparkles size={16} color="$accentPrimary" />
          <Text fontSize={14} color="$textSecondary">
            Generating your morning brief...
          </Text>
          <ActivityIndicator size="small" color="#7C5CFC" />
        </View>
      ) : isError || !brief ? (
        <Text
          fontSize={15}
          fontWeight="400"
          color="$textPrimary"
          lineHeight={22}
        >
          Welcome to Advancely! Check your tasks below and make today count.
          Every small step moves you closer to your vision.
        </Text>
      ) : (
        <Text
          fontSize={15}
          fontWeight="400"
          color="$textPrimary"
          lineHeight={22}
        >
          {brief}
        </Text>
      )}
    </View>
  );
}
