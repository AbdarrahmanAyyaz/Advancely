import React from 'react';
import { View, Text, YStack, TextArea } from 'tamagui';

interface PromptSectionProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  maxLength?: number;
  minHeight?: number;
}

export function PromptSection({
  label,
  placeholder,
  value,
  onChangeText,
  maxLength = 2000,
  minHeight = 100,
}: PromptSectionProps): React.JSX.Element {
  return (
    <YStack gap="$xs">
      <Text
        fontSize={11}
        fontWeight="600"
        color="$textSecondary"
        textTransform="uppercase"
        letterSpacing={1.2}
      >
        {label}
      </Text>

      <TextArea
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#555873"
        backgroundColor="#1A1D35"
        borderColor="$borderDefault"
        borderWidth={1}
        borderRadius={12}
        color="$textPrimary"
        fontSize={15}
        padding="$md"
        minHeight={minHeight}
        maxLength={maxLength}
        focusStyle={{
          borderColor: 'rgba(124, 92, 252, 0.6)',
        }}
      />
    </YStack>
  );
}
