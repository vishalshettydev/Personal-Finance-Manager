import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface DashboardStats {
  totalBalance: number;
  income: number;
  expenses: number;
  netWorth: number;
  assets: number;
  liabilities: number;
  totalInvestments: number;
  stocks: number;
  mutualFunds: number;
  bondsAndFDs: number;
}

export const useDashboardStats = (userId: string | null) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    income: 0,
    expenses: 0,
    netWorth: 0,
    assets: 0,
    liabilities: 0,
    totalInvestments: 0,
    stocks: 0,
    mutualFunds: 0,
    bondsAndFDs: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateStats = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all accounts with their types and current balances
      const { data: accounts, error: accountsError } = await supabase
        .from("accounts")
        .select(
          `
          *,
          account_types (
            id,
            name,
            category
          )
        `
        )
        .or(`user_id.eq.${userId},user_id.is.null`)
        .eq("is_active", true);

      if (accountsError) throw accountsError;

      // Calculate income and expenses from ALL transaction entries
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select(
          `
          *,
          transaction_entries (
            *,
            accounts (
              *,
              account_types (
                category
              )
            )
          )
        `
        )
        .eq("user_id", userId)
        .order("transaction_date", { ascending: false });

      if (transactionsError) throw transactionsError;

      // Fetch investments data
      const { data: investments, error: investmentsError } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", userId);

      if (investmentsError) throw investmentsError;

      // Calculate totals by account category
      let assets = 0;
      let liabilities = 0;
      let income = 0;
      let expenses = 0;
      let totalInvestments = 0;
      let stocks = 0;
      let mutualFunds = 0;
      let bondsAndFDs = 0;

      // Calculate real account balances from transaction entries
      const accountBalances = new Map<string, number>();

      // First, calculate balance for each account from transaction entries
      transactions?.forEach((transaction) => {
        transaction.transaction_entries?.forEach((entry) => {
          const accountId = entry.account_id;
          const category = entry.accounts?.account_types?.category;
          const debitAmount = entry.debit_amount || 0;
          const creditAmount = entry.credit_amount || 0;

          if (!accountId || !category) return;

          const currentBalance = accountBalances.get(accountId) || 0;
          let newBalance = currentBalance;

          // Calculate balance based on account type (normal balance side)
          switch (category) {
            case "ASSET":
            case "EXPENSE":
              // Assets and Expenses increase with debits, decrease with credits
              newBalance = currentBalance + debitAmount - creditAmount;
              break;
            case "LIABILITY":
            case "EQUITY":
            case "INCOME":
              // Liabilities, Equity, and Income increase with credits, decrease with debits
              newBalance = currentBalance + creditAmount - debitAmount;
              break;
          }

          accountBalances.set(accountId, newBalance);
        });
      });

      // Sum balances by category for assets and liabilities
      accounts?.forEach((account) => {
        const balance = accountBalances.get(account.id) || 0;
        const category = account.account_types?.category;

        switch (category) {
          case "ASSET":
            // Include all asset balances (positive and negative)
            assets += balance;
            break;
          case "LIABILITY":
            // Include all liability balances (positive and negative)
            liabilities += balance;
            break;
        }
      });

      // Calculate income and expenses from transactions
      transactions?.forEach((transaction) => {
        transaction.transaction_entries?.forEach((entry) => {
          const category = entry.accounts?.account_types?.category;
          const debitAmount = entry.debit_amount || 0;
          const creditAmount = entry.credit_amount || 0;

          switch (category) {
            case "INCOME":
              // Income accounts increase with credits
              income += creditAmount;
              break;
            case "EXPENSE":
              // Expense accounts increase with debits
              expenses += debitAmount;
              break;
          }
        });
      });

      // Calculate investment totals
      investments?.forEach((investment) => {
        const currentValue =
          (investment.quantity || 0) *
          (investment.current_price || investment.purchase_price || 0);
        totalInvestments += currentValue;

        switch (investment.investment_type) {
          case "STOCK":
            stocks += currentValue;
            break;
          case "MUTUAL_FUND":
            mutualFunds += currentValue;
            break;
          case "FD":
            bondsAndFDs += currentValue;
            break;
        }
      });

      // Calculate liquid assets for total balance (bank accounts, cash, etc.)
      let liquidAssets = 0;
      accounts?.forEach((account) => {
        const balance = accountBalances.get(account.id) || 0;
        const category = account.account_types?.category;
        const accountType = account.account_types?.name?.toLowerCase() || "";
        const accountName = account.name.toLowerCase();

        if (category === "ASSET") {
          // Include bank accounts, cash, and similar liquid assets, exclude property and investments
          if (
            accountType.includes("bank") ||
            accountType.includes("cash") ||
            accountName.includes("bank") ||
            accountName.includes("cash") ||
            accountName.includes("checking") ||
            accountName.includes("savings")
          ) {
            liquidAssets += balance; // Include negative balances too (overdrawn accounts)
          }
        }
      });

      // Calculate derived values
      const netWorth = assets - liabilities;
      const totalBalance = liquidAssets; // Total balance refers to liquid assets

      setStats({
        totalBalance,
        income,
        expenses,
        netWorth,
        assets,
        liabilities,
        totalInvestments,
        stocks,
        mutualFunds,
        bondsAndFDs,
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to calculate dashboard stats"
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      calculateStats();
    }
  }, [userId, calculateStats]);

  return {
    stats,
    loading,
    error,
    refetch: calculateStats,
  };
};
