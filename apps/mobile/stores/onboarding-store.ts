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

interface OnboardingState {
  messages: ChatMessage[];
  conversationId: string | null;
  isAiTyping: boolean;
  plan: OnboardingPlan | null;
  selectedHabitIndices: number[];
  isFinalizing: boolean;

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

  sendMessage: async (message: string): Promise<void> => {
    const { conversationId, messages } = get();

    // Add user message immediately
    set({
      messages: [...messages, { role: 'user', content: message }],
      isAiTyping: true,
    });

    try {
      const response = await api<{
        conversationId: string;
        message: string;
        modelUsed: string;
        plan?: OnboardingPlan;
      }>('/ai/onboarding', {
        method: 'POST',
        body: {
          message,
          conversationId: conversationId ?? undefined,
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
        // Auto-select all habits when plan arrives
        selectedHabitIndices: response.data.plan
          ? response.data.plan.suggested_habits.map((_, i) => i)
          : get().selectedHabitIndices,
      });
    } catch (error) {
      set({
        isAiTyping: false,
        messages: [
          ...get().messages,
          {
            role: 'assistant',
            content:
              'Sorry, I had trouble responding. Could you try again?',
          },
        ],
      });
      console.error('Onboarding AI error:', error);
    }
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
      }>('/ai/onboarding/finalize', {
        method: 'POST',
        body: {
          plan,
          selectedHabitIndices,
        },
      });

      set({ isFinalizing: false });
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
    });
  },
}));
