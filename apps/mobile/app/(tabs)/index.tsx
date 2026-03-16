import React, { useCallback, useMemo } from 'react';
import { View, Text, YStack, XStack, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { PenLine } from '@tamagui/lucide-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import {
  useTasks,
  useHabitsWeekly,
  useMorningBrief,
  usePointsSummary,
  useCompleteTask,
  useLogHabit,
  dashboardKeys,
} from '@/hooks/use-dashboard';
import { TaskItem } from '@/components/dashboard/TaskItem';
import { HabitPill } from '@/components/dashboard/HabitPill';
import { AIBriefCard } from '@/components/dashboard/AIBriefCard';
import { LevelBadge } from '@/components/dashboard/LevelBadge';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getToday(): string {
  return new Date().toISOString().split('T')[0] as string;
}

function isEvening(): boolean {
  return new Date().getHours() >= 17;
}

export default function DashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const today = getToday();

  // Queries
  const tasksQuery = useTasks(today);
  const habitsWeeklyQuery = useHabitsWeekly(today);
  const briefQuery = useMorningBrief();
  const pointsQuery = usePointsSummary();

  // Mutations
  const completeTask = useCompleteTask();
  const logHabit = useLogHabit();

  // Derived data
  const tasks = tasksQuery.data ?? [];
  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const totalTasks = tasks.length;

  const habits = habitsWeeklyQuery.data?.habits ?? [];
  const todayLogs = habitsWeeklyQuery.data?.logs?.filter(
    (l) => l.logDate === today,
  ) ?? [];
  const completedHabitIds = new Set(todayLogs.map((l) => l.habitId));

  const displayName = useMemo(() => {
    const email = user?.email ?? '';
    const meta = user?.user_metadata as Record<string, unknown> | undefined;
    const name = meta?.display_name ?? meta?.displayName ?? meta?.full_name;
    if (typeof name === 'string' && name.length > 0) return name;
    // Fall back to email prefix
    return email.split('@')[0] ?? 'there';
  }, [user]);

  // Pull to refresh
  const isRefreshing =
    tasksQuery.isRefetching ||
    habitsWeeklyQuery.isRefetching ||
    briefQuery.isRefetching;

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.tasks(today) });
    queryClient.invalidateQueries({
      queryKey: dashboardKeys.habitsWeekly(today),
    });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.morningBrief });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.pointsSummary });
  }, [today]);

  const handleCompleteTask = useCallback(
    (taskId: string) => {
      completeTask.mutate(taskId);
    },
    [completeTask],
  );

  const handleLogHabit = useCallback(
    (habitId: string) => {
      logHabit.mutate(habitId);
    },
    [logHabit],
  );

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
              alignItems="flex-start"
              paddingTop="$sm"
            >
              <YStack gap="$xs">
                <Text
                  fontSize={28}
                  fontWeight="700"
                  color="$textPrimary"
                  lineHeight={34}
                >
                  {getGreeting()}, {displayName}
                </Text>
                <Text fontSize={14} fontWeight="400" color="$textSecondary">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </YStack>

              {pointsQuery.data ? (
                <LevelBadge
                  level={pointsQuery.data.currentLevel}
                  totalPoints={pointsQuery.data.totalPoints}
                />
              ) : null}
            </XStack>

            {/* ── AI Morning Brief ───────────────────────────── */}
            <AIBriefCard
              brief={briefQuery.data}
              isLoading={briefQuery.isLoading}
              isError={briefQuery.isError}
            />

            {/* ── Today's Tasks ──────────────────────────────── */}
            <YStack gap="$md">
              <XStack justifyContent="space-between" alignItems="center">
                <Text
                  fontSize={18}
                  fontWeight="600"
                  color="$textPrimary"
                  lineHeight={24}
                >
                  Today's tasks
                </Text>
                <Text fontSize={13} fontWeight="500" color="$textSecondary">
                  {completedCount}/{totalTasks} done
                </Text>
              </XStack>

              {tasksQuery.isLoading ? (
                <View
                  backgroundColor="$backgroundSurface"
                  borderRadius={16}
                  padding="$lg"
                  borderWidth={1}
                  borderColor="$borderDefault"
                >
                  <Text fontSize={14} color="$textSecondary">
                    Loading tasks...
                  </Text>
                </View>
              ) : tasks.length === 0 ? (
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
                    No tasks for today yet. They'll appear once you complete
                    onboarding.
                  </Text>
                </View>
              ) : (
                <YStack gap="$md">
                  {tasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      id={task.id}
                      title={task.title}
                      isCompleted={task.isCompleted}
                      onComplete={handleCompleteTask}
                    />
                  ))}
                </YStack>
              )}
            </YStack>

            {/* ── Habits ─────────────────────────────────────── */}
            {habits.length > 0 ? (
              <YStack gap="$md">
                <Text
                  fontSize={18}
                  fontWeight="600"
                  color="$textPrimary"
                  lineHeight={24}
                >
                  Habits
                </Text>

                <XStack flexWrap="wrap" gap="$sm">
                  {habits.map((habit) => (
                    <HabitPill
                      key={habit.id}
                      id={habit.id}
                      name={habit.name}
                      category={habit.category}
                      isCompletedToday={completedHabitIds.has(habit.id)}
                      onLog={handleLogHabit}
                    />
                  ))}
                </XStack>
              </YStack>
            ) : null}

            {/* ── Journal Prompt (Evening Only) ──────────────── */}
            {isEvening() ? (
              <Pressable onPress={() => router.push('/(tabs)/journal')}>
                <View
                  backgroundColor="$backgroundSurface"
                  borderRadius={16}
                  padding="$lg"
                  borderWidth={1}
                  borderColor="$borderDefault"
                >
                  <XStack gap="$md" alignItems="center">
                    <View
                      width={40}
                      height={40}
                      borderRadius={12}
                      backgroundColor="$accentPrimaryMuted"
                      justifyContent="center"
                      alignItems="center"
                      flexShrink={0}
                    >
                      <PenLine size={20} color="$accentPrimary" />
                    </View>
                    <YStack flex={1} gap="$xs">
                      <Text
                        fontSize={16}
                        fontWeight="600"
                        color="$textPrimary"
                        lineHeight={22}
                      >
                        How was your day?
                      </Text>
                      <Text
                        fontSize={14}
                        fontWeight="400"
                        color="$textSecondary"
                        lineHeight={20}
                      >
                        Tap to reflect and earn +25 pts
                      </Text>
                    </YStack>
                  </XStack>
                </View>
              </Pressable>
            ) : null}
          </YStack>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
