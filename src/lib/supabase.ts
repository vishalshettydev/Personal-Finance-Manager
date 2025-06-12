import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

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
