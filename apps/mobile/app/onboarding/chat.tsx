import React, { useEffect, useRef, useState } from 'react';
import { View, Text, XStack, Input } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Send } from '@tamagui/lucide-icons';
import { ChatBubble } from '@/components/ChatBubble';
import { TypingIndicator } from '@/components/TypingIndicator';
import { ProgressDots } from '@/components/ProgressDots';
import { useOnboardingStore } from '@/stores/onboarding-store';

export default function OnboardingChatScreen(): React.JSX.Element {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { messages, isAiTyping, plan, sendMessage } = useOnboardingStore();

  // Send initial greeting from AI on mount
  useEffect(() => {
    if (messages.length === 0) {
      // Trigger the AI's first message by sending a greeting
      sendMessage("Hi, I'm ready to get started!");
    }
  }, []);

  // Navigate to review when plan is detected
  useEffect(() => {
    if (plan) {
      // Small delay so user can see the AI's final message
      const timer = setTimeout(() => {
        router.push('/onboarding/review-vision');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [plan]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isAiTyping]);

  const handleSend = (): void => {
    const trimmed = inputText.trim();
    if (!trimmed || isAiTyping) return;

    setInputText('');
    sendMessage(trimmed);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0D17' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View flex={1} backgroundColor="$background">
          {/* Header */}
          <View
            paddingHorizontal="$xl"
            paddingVertical="$lg"
            alignItems="center"
            gap="$md"
          >
            <Text
              fontSize={18}
              fontWeight="600"
              color="$textPrimary"
              lineHeight={24}
            >
              Let's define your vision
            </Text>
            <ProgressDots total={4} current={0} />
          </View>

          {/* Chat Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(_, index) => String(index)}
            renderItem={({ item }) => (
              <ChatBubble role={item.role} content={item.content} />
            )}
            contentContainerStyle={{ paddingVertical: 8 }}
            ListFooterComponent={isAiTyping ? <TypingIndicator /> : null}
            showsVerticalScrollIndicator={false}
          />

          {/* Input Area */}
          <View
            paddingHorizontal="$xl"
            paddingVertical="$md"
            borderTopWidth={1}
            borderTopColor="$borderSubtle"
            backgroundColor="$background"
          >
            <XStack gap="$sm" alignItems="flex-end">
              <Input
                flex={1}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Tell me about your vision..."
                placeholderTextColor="#555873"
                multiline
                maxLength={2000}
                height={44}
                maxHeight={120}
                backgroundColor="$backgroundInput"
                borderColor="$borderDefault"
                borderWidth={1}
                borderRadius={12}
                color="$textPrimary"
                fontSize={15}
                paddingHorizontal="$lg"
                paddingVertical="$md"
                focusStyle={{
                  borderColor: '$borderFocused',
                }}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                editable={!isAiTyping && !plan}
              />
              <Pressable
                onPress={handleSend}
                disabled={!inputText.trim() || isAiTyping || !!plan}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor:
                    !inputText.trim() || isAiTyping || !!plan
                      ? 'rgba(124, 92, 252, 0.3)'
                      : pressed
                        ? 'rgba(124, 92, 252, 0.85)'
                        : '#7C5CFC',
                  justifyContent: 'center',
                  alignItems: 'center',
                })}
              >
                <Send size={20} color="#FFFFFF" />
              </Pressable>
            </XStack>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
