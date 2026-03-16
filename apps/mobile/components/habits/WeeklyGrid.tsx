import React from 'react';
import { View, Text, XStack, YStack } from 'tamagui';
import { Pressable } from 'react-native';
import type { Habit, HabitLog } from '@/hooks/use-dashboard';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const CATEGORY_COLORS: Record<string, string> = {
  skills: '#5B9CF6',
  wealth: '#F5A623',
  health: '#34D399',
  impact: '#F472B6',
};

interface WeeklyGridProps {
  habits: Habit[];
  logs: HabitLog[];
  weekStart: string;
  today: string;
  onLogHabit: (habitId: string) => void;
}

function getWeekDates(weekStart: string): string[] {
  const dates: string[] = [];
  const start = new Date(weekStart + 'T00:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    if (iso) dates.push(iso);
  }
  return dates;
}

export function WeeklyGrid({
  habits,
  logs,
  weekStart,
  today,
  onLogHabit,
}: WeeklyGridProps): React.JSX.Element {
  const weekDates = getWeekDates(weekStart);
  const logSet = new Set(logs.map((l) => `${l.habitId}_${l.logDate}`));

  return (
    <View
      backgroundColor="$backgroundSurface"
      borderRadius={20}
      padding="$lg"
      borderWidth={1}
      borderColor="$borderDefault"
    >
      {/* Day headers */}
      <XStack marginBottom="$sm">
        <View width={90} />
        {DAY_LABELS.map((label, i) => (
          <View key={`day-${i}`} flex={1} alignItems="center">
            <Text
              fontSize={11}
              fontWeight="600"
              color={weekDates[i] === today ? '$accentPrimary' : '$textTertiary'}
              textTransform="uppercase"
              letterSpacing={0.5}
            >
              {label}
            </Text>
          </View>
        ))}
      </XStack>

      {/* Habit rows */}
      <YStack gap="$xs">
        {habits.map((habit) => {
          const categoryColor = CATEGORY_COLORS[habit.category] ?? '#7C5CFC';

          return (
            <XStack key={habit.id} alignItems="center" height={44}>
              {/* Habit name */}
              <View width={90} paddingRight="$sm">
                <Text
                  fontSize={13}
                  fontWeight="500"
                  color="$textSecondary"
                  numberOfLines={1}
                >
                  {habit.name}
                </Text>
              </View>

              {/* Day dots */}
              {weekDates.map((date) => {
                const isCompleted = logSet.has(`${habit.id}_${date}`);
                const isToday = date === today;
                const isFuture = date > today;

                let dotBg: string;
                let dotBorder = 0;
                let dotBorderColor = 'transparent';

                if (isCompleted) {
                  dotBg = categoryColor;
                } else if (isToday) {
                  dotBg = 'transparent';
                  dotBorder = 2;
                  dotBorderColor = '#7C5CFC';
                } else if (isFuture) {
                  dotBg = 'rgba(255, 255, 255, 0.04)';
                } else {
                  // Past, not completed
                  dotBg = '#1E2030';
                }

                const isTappable = isToday && !isCompleted;

                return (
                  <View
                    key={date}
                    flex={1}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Pressable
                      onPress={() => {
                        if (isTappable) onLogHabit(habit.id);
                      }}
                      disabled={!isTappable}
                      style={({ pressed }) => ({
                        opacity: pressed && isTappable ? 0.6 : 1,
                      })}
                    >
                      <View
                        width={28}
                        height={28}
                        borderRadius={14}
                        backgroundColor={dotBg}
                        borderWidth={dotBorder}
                        borderColor={dotBorderColor}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </XStack>
          );
        })}
      </YStack>
    </View>
  );
}
