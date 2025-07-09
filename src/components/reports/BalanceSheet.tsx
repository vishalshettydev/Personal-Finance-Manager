"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import { formatINR } from "@/utils/formatters";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface Account {
  id: string;
  name: string;
  balance: number;
  marketValue?: number; // Market value for investment accounts
  account_types: {
    id: string;
    name: string;
    category: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
    normal_balance: "DEBIT" | "CREDIT";
  } | null;
  parent_id: string | null;
  user_id: string | null;
}

interface BalanceSheetData {
  assets: {
    current: Account[];
    nonCurrent: Account[];
    total: number;
  };
  liabilities: {
    current: Account[];
    nonCurrent: Account[];
    total: number;
  };
  equity: {
    accounts: Account[];
    total: number;
  };
  income: {
    accounts: Account[];
    total: number;
  };
  expenses: {
    accounts: Account[];
    total: number;
  };
  netIncome: number;
  unrealizedGains: number;
  netWorth: number;
  isBalanced: boolean;
}

export function BalanceSheet() {
  const { user } = useAuthStore();
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate account balance from transaction entries
  const calculateAccountBalance = async (
    accountId: string
  ): Promise<number> => {
    try {
      const { data: entries, error } = await supabase
        .from("transaction_entries")
        .select("entry_side, amount")
        .eq("account_id", accountId);

      if (error) throw error;

      // Get account type information to determine normal balance
      const { data: account } = await supabase
        .from("accounts")
        .select(
          `
          *,
          account_types (
            id,
            name,
            category,
            normal_balance
          )
        `
        )
        .eq("id", accountId)
        .single();

      if (!account?.account_types) {
        return 0;
      }

      let balance = 0;
      entries?.forEach((entry) => {
        const amount = entry.amount || 0;
        const entrySide = entry.entry_side;

        // Apply proper accounting principles based on account type
        if (account.account_types?.normal_balance === "DEBIT") {
          // DEBIT normal balance accounts: DEBIT increases (+), CREDIT decreases (-)
          balance += entrySide === "DEBIT" ? amount : -amount;
        } else {
          // CREDIT normal balance accounts: CREDIT increases (+), DEBIT decreases (-)
          balance += entrySide === "CREDIT" ? amount : -amount;
        }
      });

      return balance;
    } catch (error) {
      console.error("Error calculating account balance:", error);
      return 0;
    }
  };

  // Helper function to check if account is investment type
  const isInvestmentAccount = (account: Account): boolean => {
    const type = account.account_types?.name?.toLowerCase() || "";
    return type === "mutual fund" || type === "stock";
  };

  // Calculate units for investment accounts
  const calculateAccountUnits = async (accountId: string): Promise<number> => {
    try {
      const { data: entries, error } = await supabase
        .from("transaction_entries")
        .select("entry_side, quantity")
        .eq("account_id", accountId);

      if (error) throw error;

      // Get account type information
      const { data: account } = await supabase
        .from("accounts")
        .select(
          `
          *,
          account_types (
            id,
            name,
            category,
            normal_balance
          )
        `
        )
        .eq("id", accountId)
        .single();

      if (!account?.account_types) {
        return 0;
      }

      let units = 0;
      entries?.forEach((entry) => {
        const quantity = entry.quantity || 0;
        const entrySide = entry.entry_side;

        // Apply proper accounting principles for units
        if (account.account_types?.normal_balance === "DEBIT") {
          // DEBIT normal balance accounts: DEBIT increases units (+), CREDIT decreases units (-)
          units += entrySide === "DEBIT" ? quantity : -quantity;
        } else {
          // CREDIT normal balance accounts: CREDIT increases units (+), DEBIT decreases units (-)
          units += entrySide === "CREDIT" ? quantity : -quantity;
        }
      });

      return units;
    } catch {
      return 0;
    }
  };

  // Get current price for investment account
  const getCurrentPrice = async (accountId: string): Promise<number> => {
    if (!user?.id) return 0;

    try {
      const { data, error } = await supabase
        .from("account_prices")
        .select("price")
        .eq("account_id", accountId)
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data?.price || 0;
    } catch {
      return 0;
    }
  };

  // Fetch accounts and generate balance sheet
  const generateBalanceSheet = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all accounts
      const { data: accounts, error } = await supabase
        .from("accounts")
        .select(
          `
          id,
          name,
          parent_id,
          user_id,
          account_types (
            id,
            name,
            category,
            normal_balance
          )
        `
        )
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      // Calculate real-time balance and market value for each account
      const accountsWithBalance: Account[] = await Promise.all(
        (accounts || []).map(async (account) => {
          const balance = await calculateAccountBalance(account.id);

          let marketValue = balance; // Default to balance for non-investment accounts

          // Calculate market value for investment accounts
          if (isInvestmentAccount(account as Account)) {
            const units = await calculateAccountUnits(account.id);
            const currentPrice = await getCurrentPrice(account.id);

            if (units > 0 && currentPrice > 0) {
              marketValue = units * currentPrice;
            }
          }

          return {
            ...account,
            balance,
            marketValue,
          } as Account;
        })
      );

      // Filter accounts by category
      const assets = accountsWithBalance.filter(
        (a) => a.account_types?.category === "ASSET" && a.balance !== 0
      );
      const liabilities = accountsWithBalance.filter(
        (a) => a.account_types?.category === "LIABILITY" && a.balance !== 0
      );
      const equity = accountsWithBalance.filter(
        (a) => a.account_types?.category === "EQUITY" && a.balance !== 0
      );
      const income = accountsWithBalance.filter(
        (a) => a.account_types?.category === "INCOME" && a.balance !== 0
      );
      const expenses = accountsWithBalance.filter(
        (a) => a.account_types?.category === "EXPENSE" && a.balance !== 0
      );

      // Categorize assets (simple categorization based on account names)
      const currentAssets = assets.filter(
        (a) =>
          a.name.toLowerCase().includes("bank") ||
          a.name.toLowerCase().includes("cash") ||
          a.name.toLowerCase().includes("checking") ||
          a.name.toLowerCase().includes("savings")
      );

      const nonCurrentAssets = assets.filter(
        (a) =>
          !currentAssets.includes(a) &&
          (a.name.toLowerCase().includes("investment") ||
            a.name.toLowerCase().includes("mutual") ||
            a.name.toLowerCase().includes("stock") ||
            a.name.toLowerCase().includes("property") ||
            a.name.toLowerCase().includes("equipment"))
      );

      // Categorize liabilities
      const currentLiabilities = liabilities.filter(
        (a) =>
          a.name.toLowerCase().includes("payable") ||
          a.name.toLowerCase().includes("credit card") ||
          a.name.toLowerCase().includes("short")
      );

      const nonCurrentLiabilities = liabilities.filter(
        (a) => !currentLiabilities.includes(a)
      );

      // Calculate totals - use market value for investment accounts to include unrealized profits
      const totalAssets = assets.reduce((sum, a) => {
        const valueToUse = isInvestmentAccount(a)
          ? a.marketValue || a.balance
          : a.balance;
        return sum + valueToUse;
      }, 0);
      const totalLiabilities = liabilities.reduce(
        (sum, a) => sum + Math.abs(a.balance),
        0
      );
      const totalEquity = equity.reduce(
        (sum, a) => sum + Math.abs(a.balance),
        0
      );

      // Calculate income and expenses totals
      const totalIncome = income.reduce(
        (sum, a) => sum + Math.abs(a.balance),
        0
      );
      const totalExpenses = expenses.reduce(
        (sum, a) => sum + Math.abs(a.balance),
        0
      );
      const netIncome = totalIncome - totalExpenses;

      // Calculate unrealized gains from investment accounts
      const unrealizedGains = assets.reduce((sum, a) => {
        if (isInvestmentAccount(a) && a.marketValue && a.balance) {
          return sum + (a.marketValue - a.balance);
        }
        return sum;
      }, 0);

      const netWorth = totalAssets - totalLiabilities;

      // Check if balance sheet balances using GNUcash approach: Assets = Liabilities + Total Equity
      // Total Equity includes: base equity + unrealized gains + net income (retained earnings)
      const totalEquityWithEarnings = totalEquity + unrealizedGains + netIncome;
      const isBalanced =
        Math.abs(totalAssets - (totalLiabilities + totalEquityWithEarnings)) <
        0.01;

      setBalanceSheet({
        assets: {
          current: currentAssets,
          nonCurrent: nonCurrentAssets,
          total: totalAssets,
        },
        liabilities: {
          current: currentLiabilities,
          nonCurrent: nonCurrentLiabilities,
          total: totalLiabilities,
        },
        equity: {
          accounts: equity,
          total: totalEquity,
        },
        income: {
          accounts: income,
          total: totalIncome,
        },
        expenses: {
          accounts: expenses,
          total: totalExpenses,
        },
        netIncome,
        unrealizedGains,
        netWorth,
        isBalanced,
      });
    } catch (error) {
      console.error("Error generating balance sheet:", error);
      setError("Failed to generate balance sheet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      generateBalanceSheet();
    }
  }, [user]);

  const renderAccountList = (accounts: Account[], title: string) => {
    if (accounts.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">{title}</h4>
        <div className="space-y-1">
          {accounts.map((account) => {
            const isInvestment = isInvestmentAccount(account);
            const displayValue = isInvestment
              ? account.marketValue || account.balance
              : account.balance;

            return (
              <div key={account.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {account.name}
                  {isInvestment && account.marketValue !== account.balance && (
                    <span className="text-xs text-purple-600 ml-1">
                      (Market Value)
                    </span>
                  )}
                </span>
                <span className="font-medium">
                  {formatINR(Math.abs(displayValue))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance Sheet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance Sheet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!balanceSheet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance Sheet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Balance Sheet
          <div className="text-sm font-normal">
            As of {new Date().toLocaleDateString()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Assets */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
              ASSETS
            </h3>

            {renderAccountList(balanceSheet.assets.current, "Current Assets")}
            {renderAccountList(
              balanceSheet.assets.nonCurrent,
              "Non-Current Assets"
            )}

            <div className="flex justify-between font-semibold text-lg pt-3 border-t">
              <span>Total Assets</span>
              <span className="text-blue-600">
                {formatINR(balanceSheet.assets.total)}
              </span>
            </div>
          </div>

          {/* Liabilities & Equity */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
              LIABILITIES & EQUITY
            </h3>

            {/* Liabilities */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-3">Liabilities</h4>
              {renderAccountList(
                balanceSheet.liabilities.current,
                "Current Liabilities"
              )}
              {renderAccountList(
                balanceSheet.liabilities.nonCurrent,
                "Non-Current Liabilities"
              )}

              <div className="flex justify-between font-medium pt-2 border-t border-gray-200">
                <span>Total Liabilities</span>
                <span className="text-red-600">
                  {formatINR(balanceSheet.liabilities.total)}
                </span>
              </div>
            </div>

            {/* Equity */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-3">Equity</h4>
              {renderAccountList(balanceSheet.equity.accounts, "")}

              {/* Add unrealized gains to equity section */}
              {balanceSheet.unrealizedGains !== 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Unrealized Gains/Losses</span>
                  <span
                    className={`font-medium ${
                      balanceSheet.unrealizedGains >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatINR(Math.abs(balanceSheet.unrealizedGains))}
                  </span>
                </div>
              )}

              <div className="flex justify-between font-medium pt-2 border-t border-gray-200">
                <span>Total Equity (including unrealized gains)</span>
                <span className="text-green-600">
                  {formatINR(
                    balanceSheet.equity.total + balanceSheet.unrealizedGains
                  )}
                </span>
              </div>
            </div>

            {/* Total Liabilities + Equity + Unrealized Gains */}
            <div className="flex justify-between font-semibold text-lg pt-3 border-t-2 border-gray-400">
              <span>Total Liabilities + Equity</span>
              <span className="text-purple-600">
                {formatINR(
                  balanceSheet.liabilities.total +
                    balanceSheet.equity.total +
                    balanceSheet.unrealizedGains
                )}
              </span>
            </div>

            {/* Income Statement Section */}
            <div className="mt-6 pt-4 border-t-2 border-gray-300">
              <h4 className="font-medium text-gray-800 mb-3">
                Income Statement Impact
              </h4>

              {/* Income */}
              <div className="mb-3">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Income
                </h5>
                {renderAccountList(balanceSheet.income.accounts, "")}
                <div className="flex justify-between font-medium pt-2 border-t border-gray-200">
                  <span>Total Income</span>
                  <span className="text-green-600">
                    {formatINR(balanceSheet.income.total)}
                  </span>
                </div>
              </div>

              {/* Expenses */}
              <div className="mb-3">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Expenses
                </h5>
                {renderAccountList(balanceSheet.expenses.accounts, "")}
                <div className="flex justify-between font-medium pt-2 border-t border-gray-200">
                  <span>Total Expenses</span>
                  <span className="text-red-600">
                    {formatINR(balanceSheet.expenses.total)}
                  </span>
                </div>
              </div>

              {/* Net Income */}
              <div className="flex justify-between font-semibold text-lg pt-3 border-t-2 border-gray-400">
                <span>Net Income (Income - Expenses)</span>
                <span
                  className={`${
                    balanceSheet.netIncome >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatINR(balanceSheet.netIncome)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Check & Financial Summary */}
        <div className="mt-8 pt-6 border-t-2 border-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className={`p-4 rounded-lg ${
                balanceSheet.isBalanced
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Balance Check</span>
                <span
                  className={`text-sm font-semibold ${
                    balanceSheet.isBalanced ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {balanceSheet.isBalanced ? "✓ Balanced" : "⚠ Not Balanced"}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Assets = Liabilities + Total Equity
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {formatINR(balanceSheet.assets.total)} ={" "}
                {formatINR(balanceSheet.liabilities.total)} +{" "}
                {formatINR(
                  balanceSheet.equity.total +
                    balanceSheet.unrealizedGains +
                    balanceSheet.netIncome
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                (Total Equity includes: Base ₹
                {formatINR(balanceSheet.equity.total).replace("₹", "")} +
                Unrealized ₹
                {formatINR(balanceSheet.unrealizedGains).replace("₹", "")} + Net
                Income ₹{formatINR(balanceSheet.netIncome).replace("₹", "")})
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="font-medium">Net Worth</span>
                <span className="text-lg font-bold text-blue-700">
                  {formatINR(balanceSheet.netWorth)}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Assets - Liabilities
              </div>
            </div>

            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Equity</span>
                <span className="text-lg font-bold text-green-700">
                  {formatINR(
                    balanceSheet.equity.total +
                      balanceSheet.unrealizedGains +
                      balanceSheet.netIncome
                  )}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Equity + Unrealized Gains + Net Income
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
