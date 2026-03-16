import React, { useCallback, useMemo } from 'react';
import { View, Text, YStack, XStack, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshControl, ActivityIndicator } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Flame, Trophy, TrendingUp } from '@tamagui/lucide-icons';
import {
  useHabitsWeekly,
  useLogHabit,
  dashboardKeys,
} from '@/hooks/use-dashboard';
import { WeeklyGrid } from '@/components/habits/WeeklyGrid';
import { StatCard } from '@/components/habits/StatCard';

function getToday(): string {
  return new Date().toISOString().split('T')[0] as string;
}

const CATEGORY_CONFIG: Record<
  string,
  { color: string; mutedColor: string; label: string }
> = {
  skills: {
    color: '#5B9CF6',
    mutedColor: 'rgba(91, 156, 246, 0.15)',
    label: 'Skills',
  },
  wealth: {
    color: '#F5A623',
    mutedColor: 'rgba(245, 166, 35, 0.15)',
    label: 'Wealth',
  },
  health: {
    color: '#34D399',
    mutedColor: 'rgba(52, 211, 153, 0.15)',
    label: 'Health',
  },
  impact: {
    color: '#F472B6',
    mutedColor: 'rgba(244, 114, 182, 0.15)',
    label: 'Impact',
  },
};

export default function HabitsScreen(): React.JSX.Element {
  const queryClient = useQueryClient();
  const today = getToday();

  const weeklyQuery = useHabitsWeekly(today);
  const logHabit = useLogHabit();

  const habits = weeklyQuery.data?.habits ?? [];
  const logs = weeklyQuery.data?.logs ?? [];
  const weekStart = weeklyQuery.data?.weekStart ?? today;

  const isRefreshing = weeklyQuery.isRefetching;

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: dashboardKeys.habitsWeekly(today),
    });
  }, [today]);

  const handleLogHabit = useCallback(
    (habitId: string) => {
      logHabit.mutate(habitId);
    },
    [logHabit],
  );

  // ── Compute stats from weekly data ──────────────────────────────────
  const stats = useMemo(() => {
    if (habits.length === 0) {
      return { currentStreak: 0, bestStreak: 0, weeklyPercent: 0 };
    }

    // Build list of dates from weekStart up to today
    const weekDates: string[] = [];
    const start = new Date(weekStart + 'T00:00:00');
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0]!;
      if (dateStr <= today) weekDates.push(dateStr);
    }

    // Build log lookup: date -> set of completed habitIds
    const logsByDate = new Map<string, Set<string>>();
    for (const log of logs) {
      if (!logsByDate.has(log.logDate)) {
        logsByDate.set(log.logDate, new Set());
      }
      logsByDate.get(log.logDate)!.add(log.habitId);
    }

    // Current streak: consecutive days from today going backwards
    // where ALL habits were completed
    let currentStreak = 0;
    for (let i = weekDates.length - 1; i >= 0; i--) {
      const date = weekDates[i]!;
      const completedIds = logsByDate.get(date);
      const allCompleted = completedIds
        ? habits.every((h) => completedIds.has(h.id))
        : false;
      if (allCompleted) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Best streak within this week
    let bestStreak = 0;
    let tempStreak = 0;
    for (const date of weekDates) {
      const completedIds = logsByDate.get(date);
      const allCompleted = completedIds
        ? habits.every((h) => completedIds.has(h.id))
        : false;
      if (allCompleted) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Weekly completion percentage
    const totalPossible = habits.length * weekDates.length;
    const totalCompleted = logs.filter((l) =>
      weekDates.includes(l.logDate),
    ).length;
    const weeklyPercent =
      totalPossible > 0
        ? Math.round((totalCompleted / totalPossible) * 100)
        : 0;

    return { currentStreak, bestStreak, weeklyPercent };
  }, [habits, logs, weekStart, today]);

  // ── Per-habit streak (consecutive days from today within the week) ──
  const habitStreaks = useMemo(() => {
    const streakMap = new Map<string, number>();

    const weekDates: string[] = [];
    const start = new Date(weekStart + 'T00:00:00');
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0]!;
      if (dateStr <= today) weekDates.push(dateStr);
    }

    const logSet = new Set(logs.map((l) => `${l.habitId}_${l.logDate}`));

    for (const habit of habits) {
      let streak = 0;
      for (let i = weekDates.length - 1; i >= 0; i--) {
        if (logSet.has(`${habit.id}_${weekDates[i]}`)) {
          streak++;
        } else {
          break;
        }
      }
      streakMap.set(habit.id, streak);
    }

    return streakMap;
  }, [habits, logs, weekStart, today]);

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
                Habits
              </Text>
              <Text fontSize={14} fontWeight="500" color="$textSecondary">
                This week
              </Text>
            </XStack>

            {/* ── Weekly Grid ──────────────────────────────────── */}
            {weeklyQuery.isLoading ? (
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
            ) : habits.length === 0 ? (
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
                  No habits yet. Complete onboarding to get started.
                </Text>
              </View>
            ) : (
              <WeeklyGrid
                habits={habits}
                logs={logs}
                weekStart={weekStart}
                today={today}
                onLogHabit={handleLogHabit}
              />
            )}

            {/* ── Stats Row ────────────────────────────────────── */}
            {habits.length > 0 ? (
              <XStack gap="$sm">
                <StatCard
                  icon={<Flame size={20} color="#F59E0B" />}
                  value={stats.currentStreak}
                  label="Current streak"
                />
                <StatCard
                  icon={<Trophy size={20} color="#7C5CFC" />}
                  value={stats.bestStreak}
                  label="Best streak"
                />
                <StatCard
                  icon={<TrendingUp size={20} color="#34D399" />}
                  value={`${stats.weeklyPercent}%`}
                  label="This week"
                />
              </XStack>
            ) : null}

            {/* ── Habit Detail List ────────────────────────────── */}
            {habits.length > 0 ? (
              <YStack gap="$md">
                <Text
                  fontSize={18}
                  fontWeight="600"
                  color="$textPrimary"
                  lineHeight={24}
                >
                  Your habits
                </Text>

                {habits.map((habit) => {
                  const config = CATEGORY_CONFIG[habit.category];
                  const streak = habitStreaks.get(habit.id) ?? 0;

                  return (
                    <View
                      key={habit.id}
                      backgroundColor="$backgroundSurface"
                      borderRadius={16}
                      padding="$lg"
                      borderWidth={1}
                      borderColor="$borderDefault"
                    >
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <XStack gap="$md" alignItems="center" flex={1}>
                          <View
                            width={10}
                            height={10}
                            borderRadius={5}
                            backgroundColor={config?.color ?? '#7C5CFC'}
                          />
                          <YStack flex={1}>
                            <Text
                              fontSize={15}
                              fontWeight="500"
                              color="$textPrimary"
                              numberOfLines={1}
                            >
                              {habit.name}
                            </Text>
                            <Text
                              fontSize={12}
                              fontWeight="500"
                              color="$textTertiary"
                              textTransform="capitalize"
                            >
                              {config?.label ?? habit.category}
                            </Text>
                          </YStack>
                        </XStack>

                        <XStack alignItems="center" gap="$xs">
                          <Flame size={14} color="#F59E0B" />
                          <Text
                            fontSize={14}
                            fontWeight="600"
                            color="$textSecondary"
                          >
                            {streak}d
                          </Text>
                        </XStack>
                      </XStack>
                    </View>
                  );
                })}
              </YStack>
            ) : null}
          </YStack>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
