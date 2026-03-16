import React from 'react';
import { View, Text, YStack } from 'tamagui';
import { Sparkles } from '@tamagui/lucide-icons';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatBubble({ role, content }: ChatBubbleProps): React.JSX.Element {
  const isAi = role === 'assistant';

  return (
    <View
      flexDirection="row"
      justifyContent={isAi ? 'flex-start' : 'flex-end'}
      paddingHorizontal="$xl"
      marginBottom="$sm"
    >
      {isAi ? (
        <View
          width={28}
          height={28}
          borderRadius={14}
          backgroundColor="$accentPrimaryMuted"
          justifyContent="center"
          alignItems="center"
          marginRight="$sm"
          marginTop={4}
          flexShrink={0}
        >
          <Sparkles size={14} color="$accentPrimary" />
        </View>
      ) : null}

      <View
        maxWidth="85%"
        backgroundColor={isAi ? '$backgroundSurface' : '$accentPrimaryMuted'}
        borderRadius={16}
        borderBottomLeftRadius={isAi ? 4 : 16}
        borderBottomRightRadius={isAi ? 16 : 4}
        paddingVertical="$md"
        paddingHorizontal="$lg"
        borderWidth={isAi ? 1 : 0}
        borderColor={isAi ? '$borderDefault' : 'transparent'}
        borderLeftWidth={isAi ? 3 : 1}
        borderLeftColor={isAi ? '$accentPrimary' : 'transparent'}
      >
        <Text
          fontSize={15}
          fontWeight="400"
          color="$textPrimary"
          lineHeight={22}
        >
          {content}
        </Text>
      </View>
    </View>
  );
}
