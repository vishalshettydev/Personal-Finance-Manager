import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { TransactionData, TransactionType } from "@/types/transaction";

export const useTransactions = (userId: string | null) => {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all transactions (income, expense, and transfers)
  const fetchAllTransactions = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all transactions with their entries and tags
      const { data: transactionsData, error: transactionsError } =
        await supabase
          .from("transactions")
          .select(
            `
          *,
          transaction_entries (
            id,
            transaction_id,
            account_id,
            quantity,
            price,
            entry_side,
            amount,
            line_number,
            description,
            accounts (
              *,
              account_types (
                *
              )
            )
          ),
          transaction_tags (
            tags (
              id,
              name,
              color
            )
          )
        `
          )
          .eq("user_id", userId)
          .order("transaction_date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(200);

      if (transactionsError) throw transactionsError;

      // Sort transaction entries by id for consistent display (until line_number is available)
      const processedTransactions = transactionsData?.map((transaction) => ({
        ...transaction,
        transaction_entries: transaction.transaction_entries?.sort((a, b) =>
          a.id.localeCompare(b.id)
        ),
      }));

      // Filter and categorize transactions
      const allTransactions =
        processedTransactions?.filter((transaction) => {
          const hasIncomeExpense = transaction.transaction_entries?.some(
            (entry) =>
              ["INCOME", "EXPENSE"].includes(
                entry.accounts?.account_types?.category || ""
              )
          );

          const hasAssetLiability = transaction.transaction_entries?.some(
            (entry) =>
              ["ASSET", "LIABILITY"].includes(
                entry.accounts?.account_types?.category || ""
              )
          );

          // Include: 1) Income/Expense transactions, 2) Transfers between Asset/Liability accounts, 3) Split transactions
          const isTransfer =
            !hasIncomeExpense &&
            hasAssetLiability &&
            (transaction.transaction_entries?.length === 2 ||
              transaction.is_split);

          return hasIncomeExpense || isTransfer || transaction.is_split;
        }) || [];

      setTransactions(allTransactions.slice(0, 100)); // Limit to 100 after filtering
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch transactions"
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Determine transaction type and category
  const getTransactionType = useCallback(
    (transaction: TransactionData): TransactionType => {
      const hasIncome = transaction.transaction_entries?.some(
        (entry) => entry.accounts?.account_types?.category === "INCOME"
      );
      const hasExpense = transaction.transaction_entries?.some(
        (entry) => entry.accounts?.account_types?.category === "EXPENSE"
      );

      if (hasIncome) return "income";
      if (hasExpense) return "expense";
      return "transfer";
    },
    []
  );

  // Get transactions for a specific account (for account-specific views)
  const getTransactionsForAccount = useCallback(
    (accountId: string): TransactionData[] => {
      return transactions.filter((transaction) =>
        transaction.transaction_entries?.some(
          (entry) => entry.account_id === accountId
        )
      );
    },
    [transactions]
  );

  return {
    transactions,
    loading,
    error,
    fetchAllTransactions,
    getTransactionType,
    getTransactionsForAccount,
    refetch: fetchAllTransactions,
  };
};
