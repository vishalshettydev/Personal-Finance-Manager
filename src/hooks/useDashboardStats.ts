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

      // Now calculate totals by category using the calculated balances
      let assets = 0;
      let liabilities = 0;
      let income = 0;
      let expenses = 0;
      let totalInvestments = 0;
      let stocks = 0;
      let mutualFunds = 0;

      // Get current prices for investment accounts
      const getCurrentPrice = async (accountId: string): Promise<number> => {
        try {
          const { data, error } = await supabase
            .from("account_prices")
            .select("price")
            .eq("account_id", accountId)
            .order("date", { ascending: false })
            .limit(1)
            .single();

          if (error && error.code !== "PGRST116") throw error;
          return data?.price || 0;
        } catch {
          return 0;
        }
      };

      // Calculate totals by account category
      for (const account of accounts || []) {
        const balance = accountBalances.get(account.id) || 0;
        const units = accountUnits.get(account.id) || 0;
        const category = account.account_types?.category;
        const accountTypeName =
          account.account_types?.name?.toLowerCase() || "";
        const accountName = account.name?.toLowerCase() || "";

        switch (category) {
          case "ASSET":
            // Check if this is an investment account
            const isInvestmentAccount =
              accountTypeName.includes("mutual fund") ||
              accountTypeName.includes("stock") ||
              accountTypeName.includes("trading") ||
              accountName.includes("quant") ||
              accountName.includes("fund") ||
              accountName.includes("equity") ||
              accountName.includes("elss") ||
              accountName.includes("tax") ||
              units !== 0; // Has units = investment account

            if (isInvestmentAccount) {
              // For investment accounts, calculate market value
              const currentPrice = await getCurrentPrice(account.id);
              let marketValue = 0;

              if (currentPrice > 0 && units > 0) {
                marketValue = units * currentPrice;
              } else {
                // Fallback to balance if no price data
                marketValue = balance;
              }

              totalInvestments += marketValue;
              assets += marketValue;

              // Categorize investment type
              if (
                accountTypeName.includes("stock") ||
                accountName.includes("stock")
              ) {
                stocks += marketValue;
              } else if (
                accountTypeName.includes("mutual fund") ||
                accountName.includes("fund") ||
                accountName.includes("quant") ||
                accountName.includes("elss")
              ) {
                mutualFunds += marketValue;
              } else {
                mutualFunds += marketValue; // Default to mutual funds
              }
            } else {
              // Regular asset account
              assets += balance;
            }
            break;

          case "LIABILITY":
            // Liability accounts have CREDIT normal balance
            // Positive balance = money owed
            liabilities += balance;
            break;

          case "EQUITY":
            // Equity accounts tracked but not displayed in dashboard
            break;

          case "INCOME":
            // Income accounts have CREDIT normal balance
            // Positive balance = money earned
            income += balance;
            break;

          case "EXPENSE":
            // Expense accounts have DEBIT normal balance
            // Positive balance = money spent
            expenses += balance;
            break;
        }
      }

      // Calculate liquid assets (excluding investments)
      let liquidAssets = 0;
      accounts?.forEach((account) => {
        const balance = accountBalances.get(account.id) || 0;
        const category = account.account_types?.category;
        const accountTypeName =
          account.account_types?.name?.toLowerCase() || "";
        const accountName = account.name?.toLowerCase() || "";

        if (category === "ASSET") {
          // Exclude investment accounts from liquid assets
          const isInvestmentAccount =
            accountTypeName.includes("mutual fund") ||
            accountTypeName.includes("stock") ||
            accountTypeName.includes("trading") ||
            accountName.includes("quant") ||
            accountName.includes("fund") ||
            accountName.includes("equity") ||
            accountName.includes("elss") ||
            accountName.includes("tax") ||
            (accountUnits.get(account.id) || 0) !== 0;

          if (!isInvestmentAccount) {
            // Include bank accounts, cash, and similar liquid assets
            if (
              accountTypeName.includes("bank") ||
              accountTypeName.includes("cash") ||
              accountName.includes("bank") ||
              accountName.includes("cash") ||
              accountName.includes("checking") ||
              accountName.includes("savings") ||
              accountName.includes("hdfc")
            ) {
              liquidAssets += balance;
            }
          }
        }
      });

      // Calculate investment metrics
      let totalInvested = 0;

      // Calculate total invested amount from transaction history
      transactions?.forEach((transaction) => {
        transaction.transaction_entries?.forEach((entry) => {
          const accountName = entry.accounts?.name?.toLowerCase() || "";
          const amount = entry.amount || 0;
          const entrySide = entry.entry_side;
          const category = entry.accounts?.account_types?.category;

          // Look for investment accounts
          if (
            category === "ASSET" &&
            (accountName.includes("quant") ||
              accountName.includes("fund") ||
              accountName.includes("elss") ||
              accountName.includes("tax") ||
              (entry.quantity || 0) > 0)
          ) {
            // For investment accounts (DEBIT normal balance):
            // DEBIT = money invested (purchase)
            // CREDIT = money withdrawn (sale)
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
      const netWorth = assets - liabilities;
      const totalBalance = liquidAssets;

      // Calculate unrealized profit and percentage
      const unrealizedProfit = totalInvestments - totalInvested;
      const unrealizedProfitPercentage =
        totalInvested > 0 ? (unrealizedProfit / totalInvested) * 100 : 0;

      // Debug: Log comprehensive info for troubleshooting
      console.log("Dashboard Stats Debug:", {
        transactionsCount: transactions?.length || 0,
        accountsCount: accounts?.length || 0,
        calculatedValues: {
          income,
          expenses,
          assets,
          liabilities,
          netWorth,
          totalInvestments,
          totalInvested,
        },
        detailedCalculation: {
          assetsBreakdown: accounts
            ?.filter((a) => a.account_types?.category === "ASSET")
            .map((a) => ({
              name: a.name,
              type: a.account_types?.name,
              balance: accountBalances.get(a.id) || 0,
              units: accountUnits.get(a.id) || 0,
            })),
          liabilitiesBreakdown: accounts
            ?.filter((a) => a.account_types?.category === "LIABILITY")
            .map((a) => ({
              name: a.name,
              balance: accountBalances.get(a.id) || 0,
            })),
          netWorthCalculation: `${assets} - ${liabilities} = ${
            assets - liabilities
          }`,
          investmentDetails: {
            totalInvestments,
            totalInvested,
            stocks,
            mutualFunds,
          },
        },
        accountsByCategory: accounts?.reduce(
          (acc: Record<string, number>, account) => {
            const category = account.account_types?.category || "UNKNOWN";
            acc[category] = (acc[category] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        allAccountsWithBalances: accounts?.map((a) => ({
          name: a.name,
          type: a.account_types?.name,
          category: a.account_types?.category,
          balance: accountBalances.get(a.id) || 0,
          units: accountUnits.get(a.id) || 0,
        })),
        incomeExpenseEntries:
          transactions?.flatMap(
            (t) =>
              t.transaction_entries
                ?.filter(
                  (e) =>
                    e.accounts?.account_types?.category === "INCOME" ||
                    e.accounts?.account_types?.category === "EXPENSE" ||
                    e.accounts?.name?.toLowerCase().includes("emi") ||
                    e.accounts?.name?.toLowerCase().includes("expense")
                )
                .map((e) => ({
                  description: t.description,
                  account_category: e.accounts?.account_types?.category,
                  account_name: e.accounts?.name,
                  entry_side: e.entry_side,
                  amount: e.amount,
                })) || []
          ) || [],
        sampleTransactionEntries: transactions?.slice(0, 3).map((t) => ({
          description: t.description,
          entries: t.transaction_entries?.map((e) => ({
            account_name: e.accounts?.name,
            account_category: e.accounts?.account_types?.category,
            entry_side: e.entry_side,
            amount: e.amount,
            quantity: e.quantity,
          })),
        })),
      });

      setStats({
        totalBalance,
        income,
        expenses,
        netWorth,
        assets,
        liabilities,
        totalInvestments,
        totalInvested,
        unrealizedProfit,
        unrealizedProfitPercentage,
        stocks,
        mutualFunds,
        bondsAndFDs: 0, // Not currently tracked separately
      });
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
