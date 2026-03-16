import type { UserContext } from '../services/ai/context-builder';

interface ReflectionJournalEntry {
  wins: string[];
  challenges: string | null;
  gratitude: string[];
  tomorrowFocus: string | null;
  mood: number | null;
}

export function buildReflectionPrompt(
  context: UserContext,
  journalEntry: ReflectionJournalEntry,
): string {
  return `You are the Advancely companion analyzing a journal entry.

USER CONTEXT:
- Vision: ${context.visionStatement}
- Today's tasks: ${context.todayTasksCompleted}/${context.todayTasksTotal}
- Habits completed today: ${context.todayHabitsCompleted}

JOURNAL ENTRY:
- Wins: ${JSON.stringify(journalEntry.wins)}
- Challenges: ${journalEntry.challenges}
- Gratitude: ${JSON.stringify(journalEntry.gratitude)}
- Tomorrow focus: ${journalEntry.tomorrowFocus}
- Mood: ${journalEntry.mood}/5

GENERATE a brief AI insight (2-3 sentences) that:
1. Validates their wins specifically
2. If they mentioned a challenge, offer one actionable reframe or suggestion
3. Connect their day to their larger vision when relevant
4. If mood has been declining over multiple days, gently note the pattern

Respond with ONLY the insight text.`;
}
