import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./database.types";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Create a single supabase client for interacting with your database
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function testSupabaseConnection() {
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
