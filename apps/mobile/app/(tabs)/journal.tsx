import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, YStack, XStack, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  RefreshControl,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Sparkles } from '@tamagui/lucide-icons';
import {
  useJournalEntry,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  journalKeys,
} from '@/hooks/use-journal';
import { useMorningBrief } from '@/hooks/use-dashboard';
import { PromptSection } from '@/components/journal/PromptSection';
import { MoodSelector } from '@/components/journal/MoodSelector';

function getToday(): string {
  return new Date().toISOString().split('T')[0] as string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0] as string;
}

export default function JournalScreen(): React.JSX.Element {
  const queryClient = useQueryClient();
  const today = getToday();

  // Date navigation
  const [selectedDate, setSelectedDate] = useState(today);
  const isToday = selectedDate === today;

  // Form state
  const [wins, setWins] = useState('');
  const [challenges, setChallenges] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [tomorrowFocus, setTomorrowFocus] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Queries
  const entryQuery = useJournalEntry(selectedDate);
  const briefQuery = useMorningBrief();

  // Mutations
  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();

  const existingEntry = entryQuery.data;
  const isSaving = createEntry.isPending || updateEntry.isPending;

  // Populate form when entry data loads
  useEffect(() => {
    if (existingEntry) {
      setWins(existingEntry.wins.join('\n'));
      setChallenges(existingEntry.challenges ?? '');
      setGratitude(existingEntry.gratitude.join('\n'));
      setTomorrowFocus(existingEntry.tomorrowFocus ?? '');
      setMood(existingEntry.mood);
    } else {
      setWins('');
      setChallenges('');
      setGratitude('');
      setTomorrowFocus('');
      setMood(null);
    }
    setHasUnsavedChanges(false);
  }, [existingEntry, selectedDate]);

  // Track changes
  const handleFieldChange = useCallback(
    (setter: (val: string) => void) => (val: string) => {
      setter(val);
      setHasUnsavedChanges(true);
    },
    [],
  );

  const handleMoodChange = useCallback((val: number) => {
    setMood(val);
    setHasUnsavedChanges(true);
  }, []);

  // Navigate dates
  const handlePrevDay = useCallback(() => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved changes',
        'You have unsaved changes. Discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => setSelectedDate((d) => addDays(d, -1)),
          },
        ],
      );
    } else {
      setSelectedDate((d) => addDays(d, -1));
    }
  }, [hasUnsavedChanges]);

  const handleNextDay = useCallback(() => {
    if (selectedDate >= today) return;
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved changes',
        'You have unsaved changes. Discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => setSelectedDate((d) => addDays(d, 1)),
          },
        ],
      );
    } else {
      setSelectedDate((d) => addDays(d, 1));
    }
  }, [selectedDate, today, hasUnsavedChanges]);

  // Save entry
  const handleSave = useCallback(async () => {
    const winsArray = wins
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const gratitudeArray = gratitude
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    const payload = {
      wins: winsArray,
      challenges: challenges.trim() || null,
      gratitude: gratitudeArray,
      tomorrowFocus: tomorrowFocus.trim() || null,
      mood,
    };

    try {
      if (existingEntry) {
        await updateEntry.mutateAsync({
          id: existingEntry.id,
          entryDate: selectedDate,
          ...payload,
        });
      } else {
        await createEntry.mutateAsync({
          entryDate: selectedDate,
          ...payload,
        });
      }
      setHasUnsavedChanges(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save entry';
      Alert.alert('Error', message);
    }
  }, [
    wins,
    challenges,
    gratitude,
    tomorrowFocus,
    mood,
    existingEntry,
    selectedDate,
  ]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: journalKeys.entry(selectedDate),
    });
  }, [selectedDate]);

  // Check if form has any content
  const hasContent =
    wins.trim().length > 0 ||
    challenges.trim().length > 0 ||
    gratitude.trim().length > 0 ||
    tomorrowFocus.trim().length > 0 ||
    mood !== null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0D17' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View flex={1} backgroundColor="$background">
          <ScrollView
            flex={1}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={entryQuery.isRefetching}
                onRefresh={onRefresh}
                tintColor="#7C5CFC"
              />
            }
          >
            <YStack paddingHorizontal="$xl" gap="$xxl" paddingBottom={120}>
              {/* ── Header ─────────────────────────────────────── */}
              <YStack gap="$xs" paddingTop="$sm">
                <Text
                  fontSize={28}
                  fontWeight="700"
                  color="$textPrimary"
                  lineHeight={34}
                >
                  Daily journal
                </Text>

                {/* Date Navigator */}
                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  marginTop="$sm"
                >
                  <Pressable
                    onPress={handlePrevDay}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.5 : 1,
                      padding: 8,
                    })}
                  >
                    <ChevronLeft size={20} color="#8B8FA3" />
                  </Pressable>

                  <YStack alignItems="center">
                    <Text
                      fontSize={15}
                      fontWeight="500"
                      color="$textPrimary"
                    >
                      {formatDate(selectedDate)}
                    </Text>
                    {isToday ? (
                      <Text
                        fontSize={12}
                        fontWeight="500"
                        color="$accentPrimary"
                      >
                        Today
                      </Text>
                    ) : null}
                  </YStack>

                  <Pressable
                    onPress={handleNextDay}
                    disabled={selectedDate >= today}
                    style={({ pressed }) => ({
                      opacity:
                        selectedDate >= today ? 0.2 : pressed ? 0.5 : 1,
                      padding: 8,
                    })}
                  >
                    <ChevronRight size={20} color="#8B8FA3" />
                  </Pressable>
                </XStack>
              </YStack>

              {/* ── AI Brief Card ──────────────────────────────── */}
              {isToday && briefQuery.data ? (
                <View
                  backgroundColor="$backgroundSurface"
                  borderRadius={20}
                  padding="$lg"
                  borderWidth={1}
                  borderColor="$borderDefault"
                  borderLeftWidth={3}
                  borderLeftColor="$accentPrimary"
                >
                  <XStack gap="$sm" alignItems="flex-start">
                    <Sparkles
                      size={16}
                      color="#7C5CFC"
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
                    <Text
                      fontSize={14}
                      fontWeight="400"
                      color="$textSecondary"
                      lineHeight={20}
                      flex={1}
                    >
                      {briefQuery.data}
                    </Text>
                  </XStack>
                </View>
              ) : null}

              {/* ── AI Insights (if existing entry has them) ──── */}
              {existingEntry?.aiInsights ? (
                <View
                  backgroundColor="$backgroundSurface"
                  borderRadius={20}
                  padding="$lg"
                  borderWidth={1}
                  borderColor="$borderAccent"
                  borderLeftWidth={3}
                  borderLeftColor="$accentPrimary"
                >
                  <XStack gap="$sm" alignItems="flex-start">
                    <Sparkles
                      size={16}
                      color="#7C5CFC"
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
                    <YStack flex={1} gap="$xs">
                      <Text
                        fontSize={11}
                        fontWeight="600"
                        color="$accentPrimary"
                        textTransform="uppercase"
                        letterSpacing={1.2}
                      >
                        AI Reflection
                      </Text>
                      <Text
                        fontSize={14}
                        fontWeight="400"
                        color="$textSecondary"
                        lineHeight={20}
                      >
                        {existingEntry.aiInsights}
                      </Text>
                    </YStack>
                  </XStack>
                </View>
              ) : null}

              {/* ── Loading State ──────────────────────────────── */}
              {entryQuery.isLoading ? (
                <View paddingVertical="$xxl" alignItems="center">
                  <ActivityIndicator color="#7C5CFC" />
                </View>
              ) : (
                <>
                  {/* ── Prompt Sections ───────────────────────── */}
                  <YStack gap="$lg">
                    <PromptSection
                      label="What were today's wins?"
                      placeholder="What went right today? (one per line)"
                      value={wins}
                      onChangeText={handleFieldChange(setWins)}
                      maxLength={2000}
                    />

                    <PromptSection
                      label="Challenges faced"
                      placeholder="What was difficult? Any obstacles?"
                      value={challenges}
                      onChangeText={handleFieldChange(setChallenges)}
                      maxLength={2000}
                    />

                    <PromptSection
                      label="Gratitude"
                      placeholder="3 things you're grateful for (one per line)"
                      value={gratitude}
                      onChangeText={handleFieldChange(setGratitude)}
                      maxLength={1500}
                    />

                    <PromptSection
                      label="Tomorrow's focus"
                      placeholder="What's the #1 priority for tomorrow?"
                      value={tomorrowFocus}
                      onChangeText={handleFieldChange(setTomorrowFocus)}
                      maxLength={500}
                      minHeight={60}
                    />
                  </YStack>

                  {/* ── Mood Selector ─────────────────────────── */}
                  <MoodSelector value={mood} onChange={handleMoodChange} />

                  {/* ── Save Button ───────────────────────────── */}
                  <View marginTop="$md">
                    <Pressable
                      onPress={handleSave}
                      disabled={isSaving || (!hasContent && !existingEntry)}
                      style={({ pressed }) => ({
                        backgroundColor:
                          isSaving || (!hasContent && !existingEntry)
                            ? 'rgba(124, 92, 252, 0.4)'
                            : pressed
                              ? 'rgba(124, 92, 252, 0.85)'
                              : '#7C5CFC',
                        height: 52,
                        borderRadius: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row',
                        gap: 8,
                      })}
                    >
                      {isSaving ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Text
                            fontSize={16}
                            fontWeight="600"
                            color="#FFFFFF"
                          >
                            {existingEntry ? 'Update entry' : 'Save entry'}
                          </Text>
                          {!existingEntry ? (
                            <Text
                              fontSize={14}
                              fontWeight="500"
                              color="rgba(255, 255, 255, 0.7)"
                            >
                              +25 pts
                            </Text>
                          ) : null}
                        </>
                      )}
                    </Pressable>
                  </View>

                  {/* ── Entry Status ──────────────────────────── */}
                  {existingEntry ? (
                    <Text
                      fontSize={12}
                      fontWeight="400"
                      color="$textTertiary"
                      textAlign="center"
                    >
                      Entry saved{' '}
                      {new Date(existingEntry.updatedAt).toLocaleTimeString(
                        'en-US',
                        {
                          hour: 'numeric',
                          minute: '2-digit',
                        },
                      )}
                    </Text>
                  ) : null}
                </>
              )}
            </YStack>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
