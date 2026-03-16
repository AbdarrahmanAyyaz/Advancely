import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { api, ApiError } from '@/services/api';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isOnboarded: boolean;

  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setOnboarded: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: true,
  isOnboarded: false,

  initialize: async (): Promise<void> => {
    try {
      // Get existing session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // Check if user has completed onboarding
        let isOnboarded = false;
        try {
          const { data: profile } = await supabase
            .from('users')
            .select('onboarding_completed_at')
            .eq('id', session.user.id)
            .single();
          isOnboarded = !!profile?.onboarding_completed_at;
        } catch {
          // Profile row may not exist yet (trigger delay) — treat as not onboarded
        }

        set({
          session,
          user: session.user,
          isOnboarded,
          isLoading: false,
        });
      } else {
        set({ session: null, user: null, isLoading: false });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (event === 'SIGNED_IN' && newSession?.user) {
          let isOnboarded = false;
          try {
            const { data: profile } = await supabase
              .from('users')
              .select('onboarding_completed_at')
              .eq('id', newSession.user.id)
              .single();
            isOnboarded = !!profile?.onboarding_completed_at;
          } catch {
            // Profile row may not exist yet — treat as not onboarded
          }

          set({
            session: newSession,
            user: newSession.user,
            isOnboarded,
          });
        } else if (event === 'SIGNED_OUT') {
          set({
            session: null,
            user: null,
            isOnboarded: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          set({ session: newSession });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false });
    }
  },

  signInWithEmail: async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  },

  signUpWithEmail: async (email: string, password: string): Promise<void> => {
    // Create user via server admin API (auto-confirms email)
    try {
      await api('/auth/signup', {
        method: 'POST',
        body: { email, password },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(err.message);
      }
      throw err;
    }

    // User is created and confirmed — now sign in to get a session
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      throw signInError;
    }
  },

  signOut: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  },

  setOnboarded: (value: boolean): void => {
    set({ isOnboarded: value });
  },
}));
