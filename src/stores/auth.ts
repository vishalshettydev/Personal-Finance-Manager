import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
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

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set) => ({
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
      } catch (error) {
        set({ loading: false });
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
        set({ loading: false });
        toast.error("Failed to create account");
        throw error;
      }
    },

    signOut: async () => {
      if (!isSupabaseConfigured()) {
        set({ user: null, loading: false });
        window.location.href = "/login";
        return;
      }

      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        set({ user: null, loading: false });
        toast.success("Signed out successfully");
        window.location.href = "/login";
      } catch (error) {
        set({ loading: false });
        toast.error("Failed to sign out");
        throw error;
      }
    },

    initialize: async () => {
      if (!isSupabaseConfigured()) {
        set({ user: null, loading: false });
        return;
      }

      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          set({ user: null, loading: false });
        } else {
          set({ user, loading: false });
        }

        supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" && session?.user) {
            set({ user: session.user, loading: false });
          } else if (event === "SIGNED_OUT") {
            set({ user: null, loading: false });
          } else if (event === "TOKEN_REFRESHED" && session?.user) {
            set({ user: session.user, loading: false });
          } else {
            set({ user: session?.user ?? null, loading: false });
          }
        });
      } catch {
        set({ user: null, loading: false });
      }
    },
  }))
);
