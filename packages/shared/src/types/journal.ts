export interface JournalEntry {
  id: string;
  userId: string;
  entryDate: string;
  wins: string[];
  challenges: string | null;
  gratitude: string[];
  tomorrowFocus: string | null;
  mood: number | null;
  aiInsights: string | null;
  createdAt: string;
  updatedAt: string;
}
