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
  totalInvested: number;
  unrealizedProfit: number;
  unrealizedProfitPercentage: number;
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
    totalInvested: 0,
    unrealizedProfit: 0,
    unrealizedProfitPercentage: 0,
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

      if (accountsError) {
        console.error("Error fetching accounts:", accountsError);
        throw new Error(`Failed to fetch accounts: ${accountsError.message}`);
      }

      // Calculate income and expenses from ALL transaction entries
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select(
          `
          *,
          transaction_entries (
            *,
            accounts (
              id,
              name,
              account_types (
                name,
                category,
                normal_balance
              )
            )
          )
        `
        )
        .eq("user_id", userId)
        .order("transaction_date", { ascending: false });

      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError);
        throw new Error(
          `Failed to fetch transactions: ${transactionsError.message}`
        );
      }

      // Fetch investments data (optional - table may not exist)
      // Note: Legacy investments table is not used in the new accounting system

      // Calculate real account balances and categorize properly by account type
      const accountBalances = new Map<string, number>();
      const accountUnits = new Map<string, number>();

      // Calculate balances for each account using proper accounting principles
      transactions?.forEach((transaction) => {
        transaction.transaction_entries?.forEach((entry) => {
          const accountId = entry.account_id;
          const amount = entry.amount || 0;
          const quantity = entry.quantity || 0;
          const entrySide = entry.entry_side;
          const accountType = entry.accounts?.account_types;

          if (!accountId || !accountType) return;

          const currentBalance = accountBalances.get(accountId) || 0;
          const currentUnits = accountUnits.get(accountId) || 0;

          // Calculate balance change using proper accounting principles
          let balanceChange = 0;
          let unitsChange = 0;

          // Apply accounting equation: Assets = Liabilities + Equity + (Revenue - Expenses)
          if (accountType.normal_balance === "DEBIT") {
            // DEBIT normal balance accounts (Assets, Expenses): DEBIT increases (+), CREDIT decreases (-)
            balanceChange = entrySide === "DEBIT" ? amount : -amount;
            unitsChange = entrySide === "DEBIT" ? quantity : -quantity;
          } else {
            // CREDIT normal balance accounts (Liabilities, Equity, Income): CREDIT increases (+), DEBIT decreases (-)
            balanceChange = entrySide === "CREDIT" ? amount : -amount;
            unitsChange = entrySide === "CREDIT" ? quantity : -quantity;
          }

          accountBalances.set(accountId, currentBalance + balanceChange);
          accountUnits.set(accountId, currentUnits + unitsChange);
        });
      });

      // Helper: is this account an investment?
      const isInvestmentAccount = (account: {
        account_types?: { name?: string } | null;
      }) => {
        const type = account.account_types?.name?.toLowerCase() || "";
        return type === "mutual fund" || type === "stock";
      };

      // Fetch current account prices for market value calculation
      const { data: accountPrices, error: pricesError } = await supabase
        .from("account_prices")
        .select("account_id, price, date")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (pricesError) {
        console.error("Error fetching account prices:", pricesError);
      }

      // Create a map of latest prices for each account
      const latestPrices = new Map<string, number>();
      accountPrices?.forEach((price) => {
        if (!latestPrices.has(price.account_id)) {
          latestPrices.set(price.account_id, price.price);
        }
      });

      let totalBalanceCalc = 0;
      let totalInvestmentsMarketValue = 0;
      let assets = 0;
      let liabilities = 0;
      let income = 0;
      let expenses = 0;
      let stocks = 0;
      let mutualFunds = 0;

      for (const account of accounts || []) {
        const balance = accountBalances.get(account.id) || 0;
        const units = accountUnits.get(account.id) || 0;
        const currentPrice = latestPrices.get(account.id) || 1; // Default to 1 if no price set
        const category = account.account_types?.category;
        const type = account.account_types?.name?.toLowerCase() || "";

        if (category === "ASSET") {
          if (isInvestmentAccount(account)) {
            // Calculate market value = units × current price
            const marketValue = units * currentPrice;
            totalInvestmentsMarketValue += marketValue;

            if (type === "stock") stocks += marketValue;
            if (type === "mutual fund") mutualFunds += marketValue;

            // Use market value for net worth calculation to include unrealized profits
            assets += marketValue;
          } else {
            totalBalanceCalc += balance;
            // Use balance for non-investment assets
            assets += balance;
          }
        } else if (category === "LIABILITY") {
          liabilities += balance;
        } else if (category === "INCOME") {
          income += balance;
        } else if (category === "EXPENSE") {
          expenses += balance;
        }
      }

      // Net worth = all assets - all liabilities
      const netWorth = assets - liabilities;

      // Calculate investment metrics
      let totalInvested = 0;

      // Calculate total invested amount from transaction history
      transactions?.forEach((transaction) => {
        transaction.transaction_entries?.forEach((entry) => {
          if (entry.accounts && isInvestmentAccount(entry.accounts)) {
            // For investment accounts (DEBIT normal balance):
            // DEBIT = money invested (purchase)
            // CREDIT = money withdrawn (sale)
            const amount = entry.amount || 0;
            const entrySide = entry.entry_side;

            if (entrySide === "DEBIT") {
              totalInvested += amount;
            } else if (entrySide === "CREDIT") {
              totalInvested -= amount;
            }
          }
        });
      });

      // Ensure no negative values for display
      totalInvested = Math.max(0, totalInvested);
      expenses = Math.max(0, expenses);
      income = Math.max(0, income);

      // Calculate derived values
      const totalBalance = totalBalanceCalc;
      const totalInvestments = totalInvestmentsMarketValue;

      // Calculate unrealized profit and percentage
      let unrealizedProfit = 0;
      let unrealizedProfitPercentage = 0;
      if (totalInvested > 0 && totalInvestments > 0) {
        unrealizedProfit = totalInvestments - totalInvested;
        unrealizedProfitPercentage = (unrealizedProfit / totalInvested) * 100;
      }

      setStats((prev) => ({
        ...prev,
        totalBalance,
        totalInvestments,
        assets,
        liabilities,
        income,
        expenses,
        netWorth,
        stocks,
        mutualFunds,
        totalInvested,
        unrealizedProfit,
        unrealizedProfitPercentage,
        bondsAndFDs: prev.bondsAndFDs,
      }));
    } catch (error) {
      console.error("Dashboard stats calculation error:", error);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    stats,
    loading,
    error,
    refetch: calculateStats,
  };
};
