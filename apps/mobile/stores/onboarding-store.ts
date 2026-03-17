import { create } from 'zustand';
import { api } from '@/services/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface OnboardingGoal {
  title: string;
  category: 'skills' | 'wealth' | 'health' | 'impact';
  description: string;
  year1_milestone: string;
}

interface OnboardingHabit {
  name: string;
  category: 'skills' | 'wealth' | 'health' | 'impact';
  linked_goal_title: string;
  reason: string;
}

interface OnboardingPlan {
  vision_statement: string;
  goals: OnboardingGoal[];
  suggested_habits: OnboardingHabit[];
}

interface FirstDayTask {
  id: string;
  title: string;
  category: string;
}

interface OnboardingState {
  messages: ChatMessage[];
  conversationId: string | null;
  isAiTyping: boolean;
  plan: OnboardingPlan | null;
  selectedHabitIndices: number[];
  isFinalizing: boolean;
  firstDayTasks: FirstDayTask[];

  sendMessage: (message: string) => Promise<void>;
  setSelectedHabitIndices: (indices: number[]) => void;
  toggleHabit: (index: number) => void;
  finalizePlan: () => Promise<{ visionId: string; goalIds: string[]; habitIds: string[]; taskIds: string[] }>;
  completeOnboarding: () => Promise<void>;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  messages: [],
  conversationId: null,
  isAiTyping: false,
  plan: null,
  selectedHabitIndices: [],
  isFinalizing: false,
  firstDayTasks: [],

  sendMessage: async (message: string): Promise<void> => {
    const { conversationId, messages } = get();

    // Add user message immediately
    set({
      messages: [...messages, { role: 'user', content: message }],
      isAiTyping: true,
    });

    const MAX_RETRIES = 2;
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // On retry, wait 3 seconds
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        const response = await api<{
          conversationId: string;
          message: string;
          modelUsed: string;
          plan?: OnboardingPlan;
        }>('/ai/onboarding', {
          method: 'POST',
          body: {
            message,
            conversationId: get().conversationId ?? undefined,
          },
        });

        const currentMessages = get().messages;
        set({
          messages: [
            ...currentMessages,
            { role: 'assistant', content: response.data.message },
          ],
          conversationId: response.data.conversationId,
          isAiTyping: false,
          plan: response.data.plan ?? get().plan,
          // Auto-select habits when plan arrives (max 3 for free tier)
          selectedHabitIndices: response.data.plan
            ? response.data.plan.suggested_habits
                .map((_, i) => i)
                .slice(0, 3)
            : get().selectedHabitIndices,
        });
        return; // Success — exit the retry loop
      } catch (error) {
        lastError = error;
        console.error(`Onboarding AI error (attempt ${attempt + 1}):`, error);
      }
    }

    // All retries exhausted
    set({
      isAiTyping: false,
      messages: [
        ...get().messages,
        {
          role: 'assistant',
          content:
            'Something went wrong. Tap to try again.',
        },
      ],
    });
  },

  setSelectedHabitIndices: (indices: number[]): void => {
    set({ selectedHabitIndices: indices });
  },

  toggleHabit: (index: number): void => {
    const { selectedHabitIndices } = get();
    if (selectedHabitIndices.includes(index)) {
      set({
        selectedHabitIndices: selectedHabitIndices.filter((i) => i !== index),
      });
    } else {
      set({ selectedHabitIndices: [...selectedHabitIndices, index] });
    }
  },

  finalizePlan: async () => {
    const { plan, selectedHabitIndices } = get();
    if (!plan) throw new Error('No plan to finalize');

    set({ isFinalizing: true });

    try {
      const response = await api<{
        visionId: string;
        goalIds: string[];
        habitIds: string[];
        taskIds: string[];
        tasks?: FirstDayTask[];
      }>('/ai/onboarding/finalize', {
        method: 'POST',
        body: {
          plan,
          selectedHabitIndices,
        },
      });

      set({
        isFinalizing: false,
        firstDayTasks: response.data.tasks ?? [],
      });
      return response.data;
    } catch (error) {
      set({ isFinalizing: false });
      throw error;
    }
  },

  completeOnboarding: async (): Promise<void> => {
    await api('/auth/complete-onboarding', { method: 'POST' });
  },

  reset: (): void => {
    set({
      messages: [],
      conversationId: null,
      isAiTyping: false,
      plan: null,
      selectedHabitIndices: [],
      isFinalizing: false,
      firstDayTasks: [],
    });
  },
}));
