import React from 'react';
import { XStack, View } from 'tamagui';

interface ProgressDotsProps {
  total: number;
  current: number;
}

export function ProgressDots({
  total,
  current,
}: ProgressDotsProps): React.JSX.Element {
  return (
    <XStack gap="$sm" justifyContent="center" alignItems="center">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          width={i === current ? 24 : 8}
          height={8}
          borderRadius={4}
          backgroundColor={
            i === current
              ? '$accentPrimary'
              : i < current
                ? '$accentPrimary'
                : '$borderDefault'
          }
          opacity={i < current ? 0.5 : 1}
        />
      ))}
    </XStack>
  );
}
