import React from 'react';
import { View, Text, YStack } from 'tamagui';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}

export function StatCard({ icon, value, label }: StatCardProps): React.JSX.Element {
  return (
    <View
      flex={1}
      backgroundColor="$backgroundSurface"
      borderRadius={16}
      padding="$lg"
      borderWidth={1}
      borderColor="$borderDefault"
      alignItems="center"
      justifyContent="center"
    >
      <YStack alignItems="center" gap="$xs">
        {icon}
        <Text fontSize={24} fontWeight="700" color="$textPrimary">
          {value}
        </Text>
        <Text
          fontSize={12}
          fontWeight="500"
          color="$textSecondary"
          textAlign="center"
        >
          {label}
        </Text>
      </YStack>
    </View>
  );
}
