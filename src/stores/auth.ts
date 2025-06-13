import { create } from "zustand";
import { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      toast.error("Authentication service is not configured");
      throw new Error("Supabase not configured");
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      set({ user: data.user, loading: false });
      toast.success("Signed in successfully");

      // Force a navigation to dashboard instead of reloading
      // This will trigger the middleware with the new session
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error("Failed to sign in");
      throw error;
    }
  },

  signUp: async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      toast.error("Authentication service is not configured");
      throw new Error("Supabase not configured");
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      set({ user: data.user, loading: false });
      toast.success("Account created successfully");
    } catch (error) {
      toast.error("Failed to create account");
      throw error;
    }
  },

  signOut: async () => {
    if (!isSupabaseConfigured()) {
      // Just clear local state if Supabase isn't configured
      set({ user: null, loading: false });
      window.location.href = "/login";
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({ user: null, loading: false });
      toast.success("Signed out successfully");

      // Use window.location for sign out to ensure clean redirect
      window.location.href = "/login";
    } catch (error) {
      toast.error("Failed to sign out");
      throw error;
    }
  },

  initialize: async () => {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase not configured, skipping auth initialization");
      set({ user: null, loading: false });
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      set({ user, loading: false });

      // Listen for auth changes but don't automatically redirect
      supabase.auth.onAuthStateChange((event, session) => {
        set({ user: session?.user ?? null, loading: false });
      });
    } catch (error) {
      set({ loading: false });
      console.error("Auth initialization error:", error);
    }
  },
}));
