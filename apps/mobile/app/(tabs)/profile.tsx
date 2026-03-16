import React, { useState, useCallback } from 'react';
import { View, Text, YStack, XStack, ScrollView, Input } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  User,
  Flame,
  Trophy,
  Clock,
  ChevronRight,
  LogOut,
  X,
  CreditCard,
} from '@tamagui/lucide-icons';
import { useAuthStore } from '@/stores/auth-store';
import { usePointsSummary, dashboardKeys } from '@/hooks/use-dashboard';
import {
  useProfile,
  usePointsHistory,
  useStreaks,
  useUpdateProfile,
  profileKeys,
} from '@/hooks/use-profile';
import { LevelProgress } from '@/components/profile/LevelProgress';
import { StatCard } from '@/components/habits/StatCard';

const EVENT_LABELS: Record<string, string> = {
  task_complete: 'Task completed',
  habit_complete: 'Habit logged',
  journal_entry: 'Journal entry',
  daily_bonus: 'Daily bonus',
  streak_bonus_7: '7-day streak',
  streak_bonus_21: '21-day streak',
  streak_bonus_30: '30-day streak',
};

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getMemberSince(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export default function ProfileScreen(): React.JSX.Element {
  const queryClient = useQueryClient();
  const signOut = useAuthStore((s) => s.signOut);

  // Queries
  const profileQuery = useProfile();
  const pointsQuery = usePointsSummary();
  const historyQuery = usePointsHistory(10);
  const streaksQuery = useStreaks();
  const updateProfile = useUpdateProfile();

  // Edit name modal
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [editName, setEditName] = useState('');

  const profile = profileQuery.data;
  const points = pointsQuery.data;
  const history = historyQuery.data ?? [];
  const streaks = streaksQuery.data ?? [];

  // Compute best streak across all habits
  const bestStreak = streaks.reduce(
    (max, s) => Math.max(max, s.bestStreak),
    0,
  );
  const currentStreak = streaks.reduce(
    (max, s) => Math.max(max, s.currentStreak),
    0,
  );

  // Days since joining
  const daysSinceJoin = profile
    ? Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(profile.createdAt).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  const isRefreshing =
    profileQuery.isRefetching ||
    pointsQuery.isRefetching ||
    historyQuery.isRefetching;

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: profileKeys.me });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.pointsSummary });
    queryClient.invalidateQueries({ queryKey: profileKeys.pointsHistory });
    queryClient.invalidateQueries({ queryKey: profileKeys.streaks });
  }, []);

  const handleOpenEditName = useCallback(() => {
    setEditName(profile?.displayName ?? '');
    setIsEditNameOpen(true);
  }, [profile]);

  const handleSaveName = useCallback(async () => {
    const name = editName.trim();
    if (name.length < 1) return;

    try {
      await updateProfile.mutateAsync({ displayName: name });
      setIsEditNameOpen(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update name');
    }
  }, [editName]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  }, [signOut]);

  const handleRestorePurchases = useCallback(() => {
    Alert.alert(
      'Restore Purchases',
      'Purchase restoration will be available when the Pro plan launches.',
      [{ text: 'OK' }],
    );
  }, []);

  const displayName =
    profile?.displayName ?? profile?.email?.split('@')[0] ?? '';

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
            <YStack gap="$lg" paddingTop="$sm">
              <Text
                fontSize={28}
                fontWeight="700"
                color="$textPrimary"
                lineHeight={34}
              >
                Profile
              </Text>

              {/* User Info */}
              <XStack gap="$lg" alignItems="center">
                <View
                  width={56}
                  height={56}
                  borderRadius={28}
                  backgroundColor="rgba(124, 92, 252, 0.15)"
                  justifyContent="center"
                  alignItems="center"
                  borderWidth={2}
                  borderColor="$accentPrimary"
                >
                  <User size={24} color="#7C5CFC" />
                </View>

                <YStack flex={1} gap="$xs">
                  <Text
                    fontSize={18}
                    fontWeight="600"
                    color="$textPrimary"
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>
                  <Text
                    fontSize={13}
                    fontWeight="400"
                    color="$textTertiary"
                    numberOfLines={1}
                  >
                    {profile?.email ?? ''}
                  </Text>
                  {profile ? (
                    <Text
                      fontSize={12}
                      fontWeight="400"
                      color="$textTertiary"
                    >
                      Member since {getMemberSince(profile.createdAt)}
                    </Text>
                  ) : null}
                </YStack>
              </XStack>
            </YStack>

            {/* ── Level Progress ────────────────────────────────── */}
            {points ? (
              <LevelProgress
                currentLevel={points.currentLevel}
                totalPoints={points.totalPoints}
                pointsToNextLevel={points.pointsToNextLevel}
                levelName={points.levelName}
              />
            ) : pointsQuery.isLoading ? (
              <View
                backgroundColor="$backgroundSurface"
                borderRadius={20}
                padding="$xl"
                borderWidth={1}
                borderColor="$borderDefault"
                alignItems="center"
              >
                <ActivityIndicator color="#7C5CFC" />
              </View>
            ) : null}

            {/* ── Stats Row ────────────────────────────────────── */}
            <XStack gap="$sm">
              <StatCard
                icon={<Flame size={20} color="#F59E0B" />}
                value={currentStreak}
                label="Current streak"
              />
              <StatCard
                icon={<Trophy size={20} color="#7C5CFC" />}
                value={bestStreak}
                label="Best streak"
              />
              <StatCard
                icon={<Clock size={20} color="#34D399" />}
                value={daysSinceJoin}
                label="Days active"
              />
            </XStack>

            {/* ── Recent Activity ───────────────────────────────── */}
            {history.length > 0 ? (
              <YStack gap="$md">
                <Text
                  fontSize={18}
                  fontWeight="600"
                  color="$textPrimary"
                  lineHeight={24}
                >
                  Recent activity
                </Text>

                <View
                  backgroundColor="$backgroundSurface"
                  borderRadius={16}
                  borderWidth={1}
                  borderColor="$borderDefault"
                  overflow="hidden"
                >
                  {history.map((event, index) => (
                    <XStack
                      key={event.id}
                      justifyContent="space-between"
                      alignItems="center"
                      paddingHorizontal="$lg"
                      paddingVertical="$md"
                      borderBottomWidth={
                        index < history.length - 1 ? 1 : 0
                      }
                      borderBottomColor="$borderDefault"
                    >
                      <YStack flex={1}>
                        <Text
                          fontSize={14}
                          fontWeight="500"
                          color="$textPrimary"
                        >
                          {EVENT_LABELS[event.eventType] ?? event.eventType}
                        </Text>
                        <Text
                          fontSize={12}
                          fontWeight="400"
                          color="$textTertiary"
                        >
                          {getRelativeTime(event.createdAt)}
                        </Text>
                      </YStack>
                      <Text
                        fontSize={14}
                        fontWeight="600"
                        color="#F5A623"
                      >
                        +{event.pointsAwarded}
                      </Text>
                    </XStack>
                  ))}
                </View>
              </YStack>
            ) : null}

            {/* ── Settings ─────────────────────────────────────── */}
            <YStack gap="$md">
              <Text
                fontSize={18}
                fontWeight="600"
                color="$textPrimary"
                lineHeight={24}
              >
                Settings
              </Text>

              <View
                backgroundColor="$backgroundSurface"
                borderRadius={16}
                borderWidth={1}
                borderColor="$borderDefault"
                overflow="hidden"
              >
                {/* Display Name */}
                <Pressable onPress={handleOpenEditName}>
                  <XStack
                    justifyContent="space-between"
                    alignItems="center"
                    paddingHorizontal="$lg"
                    paddingVertical="$md"
                    borderBottomWidth={1}
                    borderBottomColor="$borderDefault"
                  >
                    <Text
                      fontSize={15}
                      fontWeight="500"
                      color="$textPrimary"
                    >
                      Display name
                    </Text>
                    <XStack alignItems="center" gap="$xs">
                      <Text
                        fontSize={14}
                        fontWeight="400"
                        color="$textTertiary"
                        numberOfLines={1}
                      >
                        {displayName}
                      </Text>
                      <ChevronRight size={16} color="#555873" />
                    </XStack>
                  </XStack>
                </Pressable>

                {/* Email (read-only) */}
                <XStack
                  justifyContent="space-between"
                  alignItems="center"
                  paddingHorizontal="$lg"
                  paddingVertical="$md"
                  borderBottomWidth={1}
                  borderBottomColor="$borderDefault"
                >
                  <Text
                    fontSize={15}
                    fontWeight="500"
                    color="$textPrimary"
                  >
                    Email
                  </Text>
                  <Text
                    fontSize={14}
                    fontWeight="400"
                    color="$textTertiary"
                    numberOfLines={1}
                  >
                    {profile?.email ?? ''}
                  </Text>
                </XStack>

                {/* Timezone */}
                <XStack
                  justifyContent="space-between"
                  alignItems="center"
                  paddingHorizontal="$lg"
                  paddingVertical="$md"
                  borderBottomWidth={1}
                  borderBottomColor="$borderDefault"
                >
                  <Text
                    fontSize={15}
                    fontWeight="500"
                    color="$textPrimary"
                  >
                    Timezone
                  </Text>
                  <Text
                    fontSize={14}
                    fontWeight="400"
                    color="$textTertiary"
                  >
                    {profile?.timezone ?? 'UTC'}
                  </Text>
                </XStack>

                {/* Tier */}
                <XStack
                  justifyContent="space-between"
                  alignItems="center"
                  paddingHorizontal="$lg"
                  paddingVertical="$md"
                >
                  <Text
                    fontSize={15}
                    fontWeight="500"
                    color="$textPrimary"
                  >
                    Plan
                  </Text>
                  <Text
                    fontSize={14}
                    fontWeight="600"
                    color="$accentPrimary"
                    textTransform="capitalize"
                  >
                    {profile?.tier ?? 'Free'}
                  </Text>
                </XStack>
              </View>
            </YStack>

            {/* ── Restore Purchases ────────────────────────────── */}
            <Pressable
              onPress={handleRestorePurchases}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <XStack
                backgroundColor="$backgroundSurface"
                borderRadius={16}
                padding="$lg"
                borderWidth={1}
                borderColor="$borderDefault"
                alignItems="center"
                justifyContent="center"
                gap="$sm"
              >
                <CreditCard size={18} color="#8B8FA3" />
                <Text fontSize={15} fontWeight="500" color="$textSecondary">
                  Restore purchases
                </Text>
              </XStack>
            </Pressable>

            {/* ── Sign Out ─────────────────────────────────────── */}
            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <XStack
                backgroundColor="$backgroundSurface"
                borderRadius={16}
                padding="$lg"
                borderWidth={1}
                borderColor="$borderDefault"
                alignItems="center"
                justifyContent="center"
                gap="$sm"
              >
                <LogOut size={18} color="#EF4444" />
                <Text fontSize={15} fontWeight="500" color="#EF4444">
                  Sign out
                </Text>
              </XStack>
            </Pressable>
          </YStack>
        </ScrollView>

        {/* ── Edit Name Modal ──────────────────────────────────── */}
        <Modal
          visible={isEditNameOpen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsEditNameOpen(false)}
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
                  Edit display name
                </Text>
                <Pressable onPress={() => setIsEditNameOpen(false)}>
                  <X size={24} color="#8B8FA3" />
                </Pressable>
              </XStack>

              {/* Name Input */}
              <Input
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor="#555873"
                backgroundColor="#1A1D35"
                borderColor="rgba(124, 92, 252, 0.4)"
                borderWidth={1}
                borderRadius={12}
                color="#E8E8ED"
                fontSize={16}
                padding="$lg"
                maxLength={50}
                autoFocus
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
                {editName.length}/50
              </Text>

              {/* Save Button */}
              <View marginTop="$xxl">
                <Pressable
                  onPress={handleSaveName}
                  disabled={
                    updateProfile.isPending || editName.trim().length < 1
                  }
                  style={({ pressed }) => ({
                    backgroundColor:
                      updateProfile.isPending || editName.trim().length < 1
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
                  {updateProfile.isPending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text fontSize={16} fontWeight="600" color="#FFFFFF">
                      Save
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
