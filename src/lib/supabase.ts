import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./database.types";

// Get environment variables safely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if we have the required environment variables
const hasValidEnvVars = Boolean(supabaseUrl && supabaseAnonKey);

// Log warning if environment variables are missing
if (!hasValidEnvVars) {
  console.warn(
    "Supabase environment variables are missing. Authentication will not work."
  );
}

// Create a single supabase client for interacting with your database
// Always create a client with fallback values to prevent errors
export const supabase = createBrowserClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI3MjYsImV4cCI6MTk2MDc2ODcyNn0.placeholder"
);

export async function testSupabaseConnection() {
  // Don't test connection if environment variables are missing
  if (!hasValidEnvVars) {
    console.warn(
      "Cannot test Supabase connection - environment variables missing"
    );
    return false;
  }

  try {
    const { data, error } = await supabase
      .from("accounts")
      .select("count")
      .limit(1);
    if (error) throw error;
    console.log("Supabase connection successful:", data);
    return true;
  } catch (error) {
    console.error("Supabase connection failed:", error);
    return false;
  }
}

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return hasValidEnvVars;
}
