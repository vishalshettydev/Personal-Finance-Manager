import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./database.types";

// Check for environment variables with more specific error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only throw error if we're not in build mode and vars are missing
if (!supabaseUrl && typeof window !== "undefined") {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey && typeof window !== "undefined") {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Create a single supabase client for interacting with your database
// Use fallback values during build to prevent errors
export const supabase = createBrowserClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

export async function testSupabaseConnection() {
  // Don't test connection during build or when vars are missing
  if (!supabaseUrl || !supabaseAnonKey || typeof window === "undefined") {
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
