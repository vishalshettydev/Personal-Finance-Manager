import { supabase } from "@/lib/supabase";

// Generic error handler for database operations
export const handleDatabaseError = (
  error: unknown,
  operation: string
): string => {
  console.error(`Error in ${operation}:`, error);

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return `Failed to ${operation}. Please try again.`;
};

// Batch database operations utility
export const executeBatch = async <T>(
  operations: Array<() => Promise<T>>
): Promise<{ results: T[]; errors: Error[] }> => {
  const results: T[] = [];
  const errors: Error[] = [];

  for (const operation of operations) {
    try {
      const result = await operation();
      results.push(result);
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
    }
  }

  return { results, errors };
};

// Account balance calculation utilities
export const calculateAccountBalance = (
  accountId: string,
  entries: Array<{ account_id: string; amount: number; is_debit: boolean }>
): number => {
  return entries
    .filter((entry) => entry.account_id === accountId)
    .reduce((balance, entry) => {
      return balance + (entry.is_debit ? entry.amount : -entry.amount);
    }, 0);
};

// Transaction validation utilities
export const validateTransactionEntries = (
  entries: Array<{
    amount: number;
    is_debit: boolean;
  }>
): { isValid: boolean; error?: string } => {
  if (entries.length < 2) {
    return {
      isValid: false,
      error: "Transaction must have at least 2 entries",
    };
  }

  const totalDebits = entries
    .filter((entry) => entry.is_debit)
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalCredits = entries
    .filter((entry) => !entry.is_debit)
    .reduce((sum, entry) => sum + entry.amount, 0);

  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    return { isValid: false, error: "Debits and credits must be equal" };
  }

  return { isValid: true };
};

// Database query helpers
export const buildAccountQuery = (userId: string) => {
  return supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .order("name");
};

export const buildTransactionQuery = (userId: string) => {
  return supabase
    .from("transactions")
    .select(
      `
      *,
      entries (
        id,
        amount,
        is_debit,
        description,
        account:accounts (
          id,
          name,
          type
        )
      )
    `
    )
    .eq("user_id", userId)
    .order("date", { ascending: false });
};

// Date range filtering
export const getDateRangeFilter = (
  range: "week" | "month" | "quarter" | "year"
) => {
  const now = new Date();
  const start = new Date();

  switch (range) {
    case "week":
      start.setDate(now.getDate() - 7);
      break;
    case "month":
      start.setMonth(now.getMonth() - 1);
      break;
    case "quarter":
      start.setMonth(now.getMonth() - 3);
      break;
    case "year":
      start.setFullYear(now.getFullYear() - 1);
      break;
  }

  return {
    start: start.toISOString().split("T")[0],
    end: now.toISOString().split("T")[0],
  };
};
