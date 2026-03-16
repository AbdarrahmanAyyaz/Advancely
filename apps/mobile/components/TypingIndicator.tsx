import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { View } from 'tamagui';
import { Sparkles } from '@tamagui/lucide-icons';

export function TypingIndicator(): React.JSX.Element {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 200);
    const a3 = animate(dot3, 400);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, []);

  return (
    <View
      flexDirection="row"
      justifyContent="flex-start"
      paddingHorizontal="$xl"
      marginBottom="$sm"
    >
      {/* AI avatar */}
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

      {/* Typing dots */}
      <View
        backgroundColor="$backgroundSurface"
        borderRadius={16}
        borderBottomLeftRadius={4}
        paddingVertical={14}
        paddingHorizontal={20}
        borderWidth={1}
        borderColor="$borderDefault"
        borderLeftWidth={3}
        borderLeftColor="$accentPrimary"
        flexDirection="row"
        gap={6}
        alignItems="center"
      >
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#7C5CFC',
              opacity: dot,
            }}
          />
        ))}
      </View>
    </View>
  );
}
