"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  TrendingUp,
  Wallet,
  Landmark,
  PiggyBank,
} from "lucide-react";
import { toast } from "sonner";

interface Account {
  id: string;
  user_id: string | null;
  parent_id?: string | null;
  account_type_id: string | null;
  name: string;
  code?: string | null;
  description?: string | null;
  is_placeholder?: boolean | null;
  is_active: boolean | null;
  balance: number | null;
  created_at: string | null;
  updated_at: string | null;
  account_types?: {
    id: string;
    name: string;
    category: string;
    normal_balance?: string;
  } | null;
}

interface Transaction {
  id: string;
  reference_number: string | null;
  description: string;
  transaction_date: string;
  total_amount: number;
  notes: string | null;
  created_at: string | null;
  transaction_entries: Array<{
    id: string;
    entry_side: string;
    amount: number | null;
    quantity: number | null;
    account_id: string | null;
    accounts: {
      id: string;
      name: string;
      account_types: {
        name: string;
        category: string;
      } | null;
    } | null;
  }>;
}

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading, initialize } = useAuthStore();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [calculatedBalance, setCalculatedBalance] = useState<number>(0);

  const accountId = params?.id as string;

  // Get icon based on account type
  const getAccountIcon = (accountType: string, accountName: string) => {
    const type = accountType.toLowerCase();
    const name = accountName.toLowerCase();

    if (type.includes("bank") || name.includes("bank")) return Landmark;
    if (type.includes("cash") || name.includes("cash")) return Wallet;
    if (type.includes("credit") || name.includes("credit")) return CreditCard;
    if (
      type.includes("investment") ||
      type.includes("stock") ||
      type.includes("mutual")
    )
      return TrendingUp;
    if (type.includes("asset") || name.includes("asset")) return Building2;
    if (type.includes("liability") || name.includes("liability"))
      return CreditCard;
    if (type.includes("equity") || name.includes("equity")) return PiggyBank;
    if (type.includes("income") || name.includes("income")) return TrendingUp;
    if (type.includes("expense") || name.includes("expense")) return Wallet;

    return Building2; // Default icon
  };

  // Format currency in Indian Rupees
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Check if account is investment type
  const isInvestmentAccount = (account: Account): boolean => {
    return (
      account.account_types?.name?.toLowerCase().includes("mutual fund") ||
      account.account_types?.name?.toLowerCase().includes("stock") ||
      false
    );
  };

  // Fetch account details
  const fetchAccount = async () => {
    if (!user || !accountId) return;

    try {
      const { data, error } = await supabase
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

      if (error) throw error;
      setAccount(data as Account);
    } catch (error) {
      console.error("Error fetching account:", error);
      toast.error("Failed to load account details");
    }
  };

  // Fetch transactions for this account
  const fetchTransactions = async () => {
    if (!user || !accountId) return;

    try {
      // First, get all transaction IDs that involve this account
      const { data: accountTransactions, error: transactionIdsError } =
        await supabase
          .from("transaction_entries")
          .select("transaction_id")
          .eq("account_id", accountId);

      if (transactionIdsError) throw transactionIdsError;

      const transactionIds: string[] =
        accountTransactions
          ?.map((t) => t.transaction_id)
          .filter((id): id is string => id !== null) || [];

      if (transactionIds.length === 0) {
        setTransactions([]);
        return;
      }

      // Now get complete transaction data for these transactions
      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          id,
          reference_number,
          description,
          transaction_date,
          total_amount,
          notes,
          created_at,
          transaction_entries (
            id,
            entry_side,
            amount,
            quantity,
            account_id,
            accounts (
              id,
              name,
              account_types (
                name,
                category
              )
            )
          )
        `
        )
        .in("id", transactionIds)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    }
  };

  // Get the other account(s) involved in a transaction
  const getOtherAccounts = (transaction: Transaction): string => {
    // Get all entries for this transaction
    const allEntries = transaction.transaction_entries;

    // Find entries that are NOT for the current account
    const otherEntries = allEntries.filter(
      (entry) => entry.account_id !== accountId
    );

    if (otherEntries.length === 0) {
      return "";
    }

    if (otherEntries.length === 1) {
      // Single other account
      return otherEntries[0].accounts?.name || "Unknown Account";
    } else {
      // Multiple other accounts (split transaction)
      const accountNames = otherEntries
        .map((entry) => entry.accounts?.name || "Unknown")
        .filter((name, index, array) => array.indexOf(name) === index); // Remove duplicates

      if (accountNames.length === 1) {
        return accountNames[0];
      } else if (accountNames.length === 2) {
        return accountNames.join(" & ");
      } else {
        return `${accountNames[0]} & ${accountNames.length - 1} others`;
      }
    }
  };

  // Fetch current price for investment accounts
  const fetchCurrentPrice = async () => {
    if (!user || !accountId || !account || !isInvestmentAccount(account))
      return;

    try {
      const { data, error } = await supabase
        .from("account_prices")
        .select("*")
        .eq("account_id", accountId)
        .order("date", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setCurrentPrice(data?.price || null);
    } catch (error) {
      console.error("Error fetching current price:", error);
    }
  };

  // Calculate investment metrics using proper accounting principles
  const calculateInvestmentMetrics = () => {
    if (!account || !isInvestmentAccount(account)) return null;

    let totalInvested = 0;
    let totalUnits = 0;

    transactions.forEach((transaction) => {
      transaction.transaction_entries.forEach((entry) => {
        // Only consider entries for the current investment account
        if (entry.account_id === accountId) {
          // For investment accounts (ASSET accounts with DEBIT normal balance):
          // DEBIT = Money invested (buying) - increases asset
          // CREDIT = Money withdrawn (selling) - decreases asset
          if (entry.entry_side === "DEBIT") {
            // Money invested (buying)
            totalInvested += entry.amount || 0;
            totalUnits += entry.quantity || 0;
          } else if (entry.entry_side === "CREDIT") {
            // Money withdrawn (selling)
            totalInvested -= entry.amount || 0;
            totalUnits -= entry.quantity || 0;
          }
        }
      });
    });

    const currentValue =
      currentPrice && totalUnits > 0 ? totalUnits * currentPrice : 0;
    const gain = currentValue - totalInvested;
    const gainPercentage = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalUnits,
      currentValue,
      gain,
      gainPercentage,
    };
  };

  // Calculate account balance from transaction entries
  const calculateAccountBalance = async () => {
    if (!user || !accountId) return 0;

    try {
      const { data: entries, error } = await supabase
        .from("transaction_entries")
        .select("entry_side, amount")
        .eq("account_id", accountId);

      if (error) throw error;

      // Get account type information to determine normal balance
      const { data: accountData } = await supabase
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

      if (!accountData?.account_types) {
        return 0;
      }

      let balance = 0;
      entries?.forEach((entry) => {
        const amount = entry.amount || 0;
        const entrySide = entry.entry_side;

        // Apply proper accounting principles based on account type
        if (accountData.account_types?.normal_balance === "DEBIT") {
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

  useEffect(() => {
    if (!user && loading) {
      initialize();
    }
  }, [user, loading, initialize]);

  useEffect(() => {
    if (user && accountId) {
      const loadData = async () => {
        setIsLoading(true);
        await fetchAccount();
        await fetchTransactions();

        // Calculate the actual balance from transaction entries
        const balance = await calculateAccountBalance();
        setCalculatedBalance(balance);

        setIsLoading(false);
      };
      loadData();
    }
  }, [user, accountId]);

  useEffect(() => {
    if (account) {
      fetchCurrentPrice();
    }
  }, [account]);

  if (!user && !loading) {
    router.push("/login");
    return null;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading account details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!account) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Account not found</div>
        </div>
      </DashboardLayout>
    );
  }

  const Icon = getAccountIcon(account.account_types?.name || "", account.name);
  const investmentMetrics = calculateInvestmentMetrics();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <Icon className="h-6 w-6 text-gray-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {account.name}
                </h1>
                <p className="text-sm text-gray-500">
                  {account.account_types?.name} •{" "}
                  {account.account_types?.category}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Summary */}
        {isInvestmentAccount(account) && investmentMetrics ? (
          /* Investment Account Summary */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Invested
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-gray-900">
                  {formatINR(investmentMetrics.totalInvested)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Units
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-gray-900">
                  {investmentMetrics.totalUnits.toFixed(3)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Current Price
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-gray-900">
                  {currentPrice ? formatINR(currentPrice) : "N/A"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Market Value
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-gray-900">
                  {formatINR(investmentMetrics.currentValue)}
                </div>
                <div
                  className={`text-sm ${
                    investmentMetrics.gain >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {investmentMetrics.gain >= 0 ? "+" : ""}
                  {formatINR(investmentMetrics.gain)} (
                  {investmentMetrics.gainPercentage.toFixed(2)}%)
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Regular Account Summary */
          <Card>
            <CardHeader>
              <CardTitle>Account Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {formatINR(calculatedBalance)}
              </div>
              {account.description && (
                <p className="text-gray-600 mt-2">{account.description}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No transactions found for this account
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => {
                  // Find the entry for the current account
                  const entry =
                    transaction.transaction_entries.find(
                      (e) => e.account_id === accountId
                    ) || transaction.transaction_entries[0];

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {transaction.description}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span>
                            {formatDate(transaction.transaction_date)}
                          </span>
                          {transaction.reference_number && (
                            <>
                              <span>•</span>
                              <span>Ref: {transaction.reference_number}</span>
                            </>
                          )}
                        </div>
                        {/* Show the other account involved */}
                        <div className="text-sm text-blue-600">
                          {getOtherAccounts(transaction)}
                        </div>
                        {isInvestmentAccount(account) &&
                          entry.quantity &&
                          entry.quantity > 0 && (
                            <div className="text-sm text-purple-600">
                              {entry.quantity.toFixed(3)} units
                            </div>
                          )}
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-semibold ${
                            // For all account types, use proper accounting logic
                            // DEBIT normal balance accounts (Assets, Expenses): DEBIT = +, CREDIT = -
                            // CREDIT normal balance accounts (Liabilities, Equity, Income): CREDIT = +, DEBIT = -
                            account.account_types?.normal_balance === "DEBIT"
                              ? entry.entry_side === "DEBIT"
                                ? "text-green-600"
                                : "text-red-600"
                              : entry.entry_side === "CREDIT"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {account.account_types?.normal_balance === "DEBIT"
                            ? entry.entry_side === "DEBIT"
                              ? "+"
                              : "-"
                            : entry.entry_side === "CREDIT"
                            ? "+"
                            : "-"}
                          {formatINR(Math.abs(entry.amount || 0))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
