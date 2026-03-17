import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
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
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  setOnboarded: (value: boolean) => void;
}

/**
 * Fetches the user's profile from the users table.
 * If the profile doesn't exist (handle_new_user trigger failed),
 * creates it as a fallback so the user isn't stuck.
 */
async function ensureProfile(userId: string, email?: string): Promise<boolean> {
  // Try to fetch existing profile
  const { data: profile, error } = await supabase
    .from('users')
    .select('onboarding_completed_at')
    .eq('id', userId)
    .single();

  if (profile) {
    return !!profile.onboarding_completed_at;
  }

  // Profile doesn't exist — trigger may have failed. Create it manually.
  if (error?.code === 'PGRST116' || !profile) {
    try {
      await supabase.from('users').insert({
        id: userId,
        email: email ?? '',
        tier: 'free',
        total_points: 0,
        current_level: 1,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    } catch {
      // Insert may fail if trigger fired concurrently — that's fine
    }
  }

  return false;
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
        let isOnboarded = false;
        try {
          isOnboarded = await ensureProfile(session.user.id, session.user.email);
        } catch {
          // Treat as not onboarded
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
            isOnboarded = await ensureProfile(
              newSession.user.id,
              newSession.user.email,
            );
          } catch {
            // Treat as not onboarded
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

  signInWithApple: async (): Promise<void> => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS');
    }

    const AppleAuthentication = await import('expo-apple-authentication');

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple Sign-In failed: no identity token returned');
    }

    // Exchange Apple identity token with Supabase
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) {
      throw error;
    }

    // Apple only provides the full name on the FIRST sign-in — save it immediately
    if (credential.fullName?.givenName || credential.fullName?.familyName) {
      const nameParts = [
        credential.fullName.givenName,
        credential.fullName.familyName,
      ].filter(Boolean);
      const fullName = nameParts.join(' ');

      if (fullName) {
        await supabase.auth.updateUser({ data: { full_name: fullName } });
      }
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
