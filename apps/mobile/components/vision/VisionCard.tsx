import React from 'react';
import { View, Text, XStack, YStack } from 'tamagui';

interface VisionCardProps {
  statement: string;
  version: number;
  updatedAt: string;
}

export function VisionCard({
  statement,
  version,
  updatedAt,
}: VisionCardProps): React.JSX.Element {
  const timeAgo = getTimeAgo(updatedAt);

  return (
    <View
      backgroundColor="$backgroundSurface"
      borderRadius={20}
      padding="$xl"
      borderWidth={1}
      borderColor="$borderAccent"
    >
      {/* Label */}
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

      {/* Vision Statement */}
      <Text
        fontSize={15}
        fontWeight="400"
        color="$textPrimary"
        lineHeight={22}
        fontStyle="italic"
      >
        "{statement}"
      </Text>

      {/* Meta */}
      <Text
        fontSize={12}
        fontWeight="500"
        color="$textTertiary"
        marginTop="$lg"
      >
        {timeAgo} — v{version}
      </Text>
    </View>
  );
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Updated today';
  if (diffDays === 1) return 'Updated yesterday';
  if (diffDays < 7) return `Updated ${diffDays} days ago`;
  if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)} weeks ago`;
  return `Updated ${Math.floor(diffDays / 30)} months ago`;
}
