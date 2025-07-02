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

      // Calculate real account balances and units from transaction entries
      const accountBalances = new Map<string, number>();
      const accountUnits = new Map<string, number>();

      // First, calculate balance and units for each account from transaction entries
      // Using proper accounting principles based on account type
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

          // For non-investment accounts, use standard accounting rules
          if (accountType.normal_balance === "DEBIT") {
            // DEBIT normal balance accounts: DEBIT increases (+), CREDIT decreases (-)
            balanceChange = entrySide === "DEBIT" ? amount : -amount;
            unitsChange = entrySide === "DEBIT" ? quantity : -quantity;
          } else {
            // CREDIT normal balance accounts: CREDIT increases (+), DEBIT decreases (-)
            balanceChange = entrySide === "CREDIT" ? amount : -amount;
            unitsChange = entrySide === "CREDIT" ? quantity : -quantity;
          }

          accountBalances.set(accountId, currentBalance + balanceChange);
          accountUnits.set(accountId, currentUnits + unitsChange);
        });
      });

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

      // Sum balances by category for assets and liabilities
      // Use await for async operations to get market values for investment accounts
      for (const account of accounts || []) {
        const balance = accountBalances.get(account.id) || 0;
        const units = accountUnits.get(account.id) || 0;
        const category = account.account_types?.category;
        const accountType = account.account_types?.name?.toLowerCase() || "";

        switch (category) {
          case "ASSET":
            // Check if this is an investment account
            const isInvestmentAccount =
              accountType.includes("mutual fund") ||
              accountType.includes("stock");

            if (isInvestmentAccount && units > 0) {
              // For investment accounts, use market value (units × current price)
              const currentPrice = await getCurrentPrice(account.id);
              if (currentPrice > 0) {
                const marketValue = units * currentPrice;
                assets += marketValue;
              } else {
                // Fallback to balance if no price available
                assets += balance;
              }
            } else {
              // For regular assets, use balance
              assets += balance;
            }
            break;
          case "LIABILITY":
            // Liabilities: Credit balance = money you owe (positive liability)
            // For net worth calculation, we want positive liabilities to be subtracted
            liabilities += Math.abs(balance); // Ensure liabilities are always positive for net worth calc
            break;
        }
      }

      // Calculate income and expenses from transactions
      // With proper accounting principles: track credits to income and debits to expenses
      transactions?.forEach((transaction) => {
        transaction.transaction_entries?.forEach((entry) => {
          const category = entry.accounts?.account_types?.category;
          const amount = entry.amount || 0;
          const entrySide = entry.entry_side;

          switch (category) {
            case "INCOME":
              // Income represents money you've earned - track credits to income accounts
              if (entrySide === "CREDIT") {
                income += amount;
              }
              break;
            case "EXPENSE":
              // Expenses represent money you've spent - track debits to expense accounts
              if (entrySide === "DEBIT") {
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
            const entrySide = entry.entry_side;
            const accountCategory = entry.accounts?.account_types?.category;

            // Skip internal transfers between asset accounts
            if (
              accountCategory === "ASSET" ||
              accountCategory === "LIABILITY"
            ) {
              return;
            }

            // Follow proper accounting:
            // Income accounts (CREDIT normal): CREDIT increases income
            // Expense accounts (DEBIT normal): DEBIT increases expenses
            if (
              accountCategory === "INCOME" &&
              entrySide === "CREDIT" &&
              amount > 0
            ) {
              income += amount;
            } else if (
              accountCategory === "EXPENSE" &&
              entrySide === "DEBIT" &&
              amount > 0
            ) {
              expenses += amount;
            }
          });
        });
      }

      // Calculate investment totals and invested amounts from our own accounts
      let totalInvested = 0;

      for (const account of accounts || []) {
        const units = accountUnits.get(account.id) || 0;
        const investedAmount = accountBalances.get(account.id) || 0; // This is the actual money invested
        const accountType = account.account_types?.name?.toLowerCase() || "";
        const category = account.account_types?.category;

        if (category === "ASSET" && units > 0) {
          const isInvestmentAccount =
            accountType.includes("mutual fund") ||
            accountType.includes("stock");

          if (isInvestmentAccount) {
            // Add to total invested amount (actual money put in)
            totalInvested += Math.abs(investedAmount);

            const currentPrice = await getCurrentPrice(account.id);
            if (currentPrice > 0) {
              const marketValue = units * currentPrice;
              totalInvestments += marketValue;

              if (accountType.includes("stock")) {
                stocks += marketValue;
              } else if (accountType.includes("mutual fund")) {
                mutualFunds += marketValue;
              }
            } else {
              // If no current price, use invested amount as fallback
              totalInvestments += Math.abs(investedAmount);

              if (accountType.includes("stock")) {
                stocks += Math.abs(investedAmount);
              } else if (accountType.includes("mutual fund")) {
                mutualFunds += Math.abs(investedAmount);
              }
            }
          }
        }
      }

      // Also include legacy investments if they exist
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
          // Exclude investment accounts from liquid assets
          const isInvestmentAccount =
            accountType.includes("mutual fund") ||
            accountType.includes("stock");

          if (!isInvestmentAccount) {
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
        }
      });

      // Calculate derived values
      const netWorth = assets - liabilities;
      const totalBalance = liquidAssets; // Total balance refers to liquid assets

      // Calculate unrealized profit and percentage
      const unrealizedProfit = totalInvestments - totalInvested;
      const unrealizedProfitPercentage =
        totalInvested > 0 ? (unrealizedProfit / totalInvested) * 100 : 0;

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
                  entry_side: e.entry_side,
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
        totalInvested,
        unrealizedProfit,
        unrealizedProfitPercentage,
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
