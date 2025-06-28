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
            id,
            account_id,
            quantity,
            price,
            entry_type,
            amount,
            description,
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

      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError);
        throw new Error(
          `Failed to fetch transactions: ${transactionsError.message}`
        );
      }

      // Fetch investments data (optional - table may not exist)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let investments: any[] = [];
      try {
        const { data: investmentsData, error: investmentsError } =
          await supabase.from("investments").select("*").eq("user_id", userId);

        if (investmentsError) {
          console.warn(
            "Investments table may not exist, skipping:",
            investmentsError
          );
          // Don't throw error for investments table - it's optional
        } else {
          investments = investmentsData || [];
        }
      } catch (investmentError) {
        console.warn(
          "Error fetching investments (table may not exist):",
          investmentError
        );
        // Investments are optional, continue without them
      }

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
      // Using simplified logic: CREDIT = money deposited (+), DEBIT = money withdrawn (-)
      transactions?.forEach((transaction) => {
        transaction.transaction_entries?.forEach((entry) => {
          const accountId = entry.account_id;
          const amount = entry.amount || 0;
          const entryType = entry.entry_type;

          if (!accountId) return;

          const currentBalance = accountBalances.get(accountId) || 0;
          // Simple logic: CREDIT adds to balance, DEBIT subtracts from balance
          let balanceChange = 0;
          if (entryType === "CREDIT") {
            balanceChange = amount;
          } else if (entryType === "DEBIT") {
            balanceChange = -amount;
          } else if (entryType === "BUY") {
            balanceChange = -amount; // Money going out
          } else if (entryType === "SELL") {
            balanceChange = amount; // Money coming in
          }

          accountBalances.set(accountId, currentBalance + balanceChange);
        });
      });

      // Sum balances by category for assets and liabilities
      accounts?.forEach((account) => {
        const balance = accountBalances.get(account.id) || 0;
        const category = account.account_types?.category;

        switch (category) {
          case "ASSET":
            // Assets: Include all asset balances (positive when you own money/things)
            assets += balance;
            break;
          case "LIABILITY":
            // Liabilities: Credit balance = money you owe (positive liability)
            // For net worth calculation, we want positive liabilities to be subtracted
            liabilities += Math.abs(balance); // Ensure liabilities are always positive for net worth calc
            break;
        }
      });

      // Calculate income and expenses from transactions
      // With simplified logic: track actual money flow to/from income and expense accounts
      transactions?.forEach((transaction) => {
        transaction.transaction_entries?.forEach((entry) => {
          const category = entry.accounts?.account_types?.category;
          const amount = entry.amount || 0;
          const entryType = entry.entry_type;

          switch (category) {
            case "INCOME":
              // Income represents money you've earned - track credits to income accounts
              if (entryType === "CREDIT") {
                income += amount;
              }
              break;
            case "EXPENSE":
              // Expenses represent money you've spent - track debits to expense accounts
              if (entryType === "DEBIT") {
                expenses += amount;
              }
              break;
          }
        });
      });

      // Alternative calculation: If no INCOME/EXPENSE accounts found,
      // calculate from account balance changes (income = money in, expenses = money out)
      if (income === 0 && expenses === 0) {
        transactions?.forEach((transaction) => {
          transaction.transaction_entries?.forEach((entry) => {
            const amount = entry.amount || 0;
            const entryType = entry.entry_type;
            const accountCategory = entry.accounts?.account_types?.category;

            // Skip internal transfers between asset accounts
            if (
              accountCategory === "ASSET" ||
              accountCategory === "LIABILITY"
            ) {
              return;
            }

            // Fixed logic: DEBIT = money coming in (income), CREDIT = money going out (expenses)
            if (entryType === "DEBIT" && amount > 0) {
              income += amount; // Money coming in
            } else if (entryType === "CREDIT" && amount > 0) {
              expenses += amount; // Money going out
            }
          });
        });
      }

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

      // Debug: Log comprehensive info for troubleshooting
      console.log("Dashboard Stats Debug:", {
        transactionsCount: transactions?.length || 0,
        accountsCount: accounts?.length || 0,
        calculatedValues: { income, expenses, assets, liabilities, netWorth },
        detailedCalculation: {
          assetsBreakdown: accounts
            ?.filter((a) => a.account_types?.category === "ASSET")
            .map((a) => ({
              name: a.name,
              balance: accountBalances.get(a.id) || 0,
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
        },
        accountsByCategory: accounts?.reduce(
          (acc: Record<string, number>, account) => {
            const category = account.account_types?.category || "UNKNOWN";
            acc[category] = (acc[category] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        incomeExpenseEntries:
          transactions?.flatMap(
            (t) =>
              t.transaction_entries
                ?.filter(
                  (e) =>
                    e.accounts?.account_types?.category === "INCOME" ||
                    e.accounts?.account_types?.category === "EXPENSE"
                )
                .map((e) => ({
                  description: t.description,
                  account_category: e.accounts?.account_types?.category,
                  entry_type: e.entry_type,
                  amount: e.amount,
                  account_name: e.accounts?.name,
                })) || []
          ) || [],
      });

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
