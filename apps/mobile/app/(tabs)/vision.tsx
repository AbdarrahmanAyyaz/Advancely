import React, { useState, useCallback } from 'react';
import { View, Text, YStack, XStack, ScrollView, TextArea } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles, X } from '@tamagui/lucide-icons';
import {
  useActiveVision,
  useGoals,
  useUpdateVision,
  visionKeys,
} from '@/hooks/use-vision';
import { VisionCard } from '@/components/vision/VisionCard';
import { GoalCard } from '@/components/vision/GoalCard';

export default function VisionScreen(): React.JSX.Element {
  const queryClient = useQueryClient();

  const visionQuery = useActiveVision();
  const goalsQuery = useGoals();
  const updateVision = useUpdateVision();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editText, setEditText] = useState('');

  const vision = visionQuery.data;
  const goals = goalsQuery.data ?? [];
  const activeGoals = goals.filter((g) => g.status === 'active');

  const isRefreshing = visionQuery.isRefetching || goalsQuery.isRefetching;

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: visionKeys.active });
    queryClient.invalidateQueries({ queryKey: visionKeys.goals });
  }, []);

  const handleOpenEdit = (): void => {
    setEditText(vision?.statement ?? '');
    setIsEditModalOpen(true);
  };

  const handleSaveVision = async (): Promise<void> => {
    if (!vision || !editText.trim() || editText.trim().length < 10) return;

    try {
      await updateVision.mutateAsync({
        id: vision.id,
        statement: editText.trim(),
      });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update vision:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0D17' }}>
      <View flex={1} backgroundColor="$background">
        <ScrollView
          flex={1}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#7C5CFC"
            />
          }
        >
          <YStack paddingHorizontal="$xl" gap="$xxl" paddingBottom={100}>
            {/* ── Header ─────────────────────────────────────── */}
            <XStack
              justifyContent="space-between"
              alignItems="center"
              paddingTop="$sm"
            >
              <Text
                fontSize={28}
                fontWeight="700"
                color="$textPrimary"
                lineHeight={34}
              >
                Your vision
              </Text>

              {vision ? (
                <Pressable
                  onPress={handleOpenEdit}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  })}
                >
                  <Sparkles size={16} color="#7C5CFC" />
                  <Text fontSize={14} fontWeight="600" color="$accentPrimary">
                    Refine
                  </Text>
                </Pressable>
              ) : null}
            </XStack>

            {/* ── Vision Card ────────────────────────────────── */}
            {visionQuery.isLoading ? (
              <View
                backgroundColor="$backgroundSurface"
                borderRadius={20}
                padding="$xl"
                borderWidth={1}
                borderColor="$borderAccent"
                alignItems="center"
              >
                <ActivityIndicator color="#7C5CFC" />
              </View>
            ) : vision ? (
              <VisionCard
                statement={vision.statement}
                version={vision.version}
                updatedAt={vision.updatedAt}
              />
            ) : (
              <View
                backgroundColor="$backgroundSurface"
                borderRadius={20}
                padding="$xl"
                borderWidth={1}
                borderColor="$borderDefault"
                alignItems="center"
              >
                <Text
                  fontSize={14}
                  color="$textSecondary"
                  textAlign="center"
                >
                  Your vision will appear here after onboarding.
                </Text>
              </View>
            )}

            {/* ── Goals Section ──────────────────────────────── */}
            <YStack gap="$md">
              <XStack justifyContent="space-between" alignItems="center">
                <Text
                  fontSize={18}
                  fontWeight="600"
                  color="$textPrimary"
                  lineHeight={24}
                >
                  Goals ({activeGoals.length} active)
                </Text>
              </XStack>

              {goalsQuery.isLoading ? (
                <View
                  backgroundColor="$backgroundSurface"
                  borderRadius={16}
                  padding="$lg"
                  borderWidth={1}
                  borderColor="$borderDefault"
                >
                  <Text fontSize={14} color="$textSecondary">
                    Loading goals...
                  </Text>
                </View>
              ) : activeGoals.length === 0 ? (
                <View
                  backgroundColor="$backgroundSurface"
                  borderRadius={16}
                  padding="$lg"
                  borderWidth={1}
                  borderColor="$borderDefault"
                  alignItems="center"
                >
                  <Text
                    fontSize={14}
                    color="$textSecondary"
                    textAlign="center"
                  >
                    No active goals yet. Complete onboarding to get started.
                  </Text>
                </View>
              ) : (
                <YStack gap="$md">
                  {activeGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      title={goal.title}
                      category={goal.category}
                      description={goal.description}
                      progress={goal.progress}
                      milestones={goal.milestones}
                    />
                  ))}
                </YStack>
              )}
            </YStack>
          </YStack>
        </ScrollView>

        {/* ── Edit Vision Modal ──────────────────────────────── */}
        <Modal
          visible={isEditModalOpen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsEditModalOpen(false)}
        >
          <View flex={1} backgroundColor="#0B0D17" padding="$xl">
            <SafeAreaView style={{ flex: 1 }}>
              {/* Modal Header */}
              <XStack
                justifyContent="space-between"
                alignItems="center"
                marginBottom="$xxl"
              >
                <Text
                  fontSize={18}
                  fontWeight="600"
                  color="#E8E8ED"
                  lineHeight={24}
                >
                  Refine your vision
                </Text>
                <Pressable onPress={() => setIsEditModalOpen(false)}>
                  <X size={24} color="#8B8FA3" />
                </Pressable>
              </XStack>

              {/* Instructions */}
              <Text
                fontSize={14}
                fontWeight="400"
                color="#8B8FA3"
                lineHeight={20}
                marginBottom="$lg"
              >
                Write your vision in first person, present tense — as if you've
                already achieved it.
              </Text>

              {/* Text Input */}
              <TextArea
                value={editText}
                onChangeText={setEditText}
                placeholder="In 5 years, I..."
                placeholderTextColor="#555873"
                backgroundColor="#1A1D35"
                borderColor="rgba(124, 92, 252, 0.4)"
                borderWidth={1}
                borderRadius={12}
                color="#E8E8ED"
                fontSize={15}
                padding="$lg"
                minHeight={150}
                maxLength={2000}
                focusStyle={{
                  borderColor: 'rgba(124, 92, 252, 0.6)',
                }}
              />

              <Text
                fontSize={12}
                fontWeight="400"
                color="#555873"
                textAlign="right"
                marginTop="$sm"
              >
                {editText.length}/2000
              </Text>

              {/* Save Button */}
              <View marginTop="$xxl">
                <Pressable
                  onPress={handleSaveVision}
                  disabled={
                    updateVision.isPending ||
                    editText.trim().length < 10
                  }
                  style={({ pressed }) => ({
                    backgroundColor:
                      updateVision.isPending ||
                      editText.trim().length < 10
                        ? 'rgba(124, 92, 252, 0.4)'
                        : pressed
                          ? 'rgba(124, 92, 252, 0.85)'
                          : '#7C5CFC',
                    height: 52,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                  })}
                >
                  {updateVision.isPending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text fontSize={16} fontWeight="600" color="#FFFFFF">
                      Save vision
                    </Text>
                  )}
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
