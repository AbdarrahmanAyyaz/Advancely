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
      ) : isError ? (
        <View flexDirection="row" alignItems="center" gap="$sm">
          <Sparkles size={16} color="$accentPrimary" />
          <Text fontSize={14} color="$textSecondary">
            Couldn't load your morning brief. Pull to refresh.
          </Text>
        </View>
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
