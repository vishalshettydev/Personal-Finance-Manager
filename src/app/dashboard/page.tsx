"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuthStore } from "@/stores/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import ChartOfAccounts from "@/components/ChartOfAccounts";
import { TransactionList } from "@/components/transactions/TransactionList";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";

import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { FullScreenLoading } from "@/components/common/LoadingSpinner";
import { supabase } from "@/lib/supabase";
import { Tag } from "@/lib/types";

// Database response type that matches what Supabase returns
interface DatabaseAccount {
  id: string;
  user_id: string | null;
  parent_id: string | null;
  account_type_id: string | null;
  name: string;
  code: string | null;
  description: string | null;
  is_placeholder?: boolean | null;
  is_active: boolean | null;
  balance: number | null;
  created_at: string | null;
  updated_at: string | null;
  account_types: {
    id: string;
    name: string;
    category: string;
  } | null;
}

// Normalized Account type for the component
interface Account {
  id: string;
  name: string;
  parent_id: string | null;
  is_placeholder: boolean;
  is_active: boolean;
  balance: number;
  account_types: {
    id: string;
    name: string;
    category: string;
  };
}

function DashboardContent() {
  const { user, loading, initialize } = useAuthStore();

  // Data states for the modal
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Custom hooks for data management
  const {
    transactions,
    loading: transactionsLoading,
    getTransactionType,
    fetchAllTransactions,
  } = useTransactions(user?.id || null);

  const { fetchAccounts } = useAccounts(user?.id || null);

  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useDashboardStats(user?.id || null);

  useEffect(() => {
    if (!user && loading) {
      initialize();
    }
  }, [user, loading, initialize]);

  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchAllTransactions();
      fetchAccountsForModal();
      fetchTagsForModal();
    }
  }, [user, fetchAccounts, fetchAllTransactions]);

  // Normalize database response to our component interface
  const normalizeAccounts = (dbAccounts: DatabaseAccount[]): Account[] => {
    return dbAccounts
      .filter(
        (
          acc
        ): acc is DatabaseAccount & {
          account_types: NonNullable<DatabaseAccount["account_types"]>;
        } => acc.account_types !== null
      )
      .map((acc) => ({
        id: acc.id,
        name: acc.name,
        parent_id: acc.parent_id,
        is_placeholder: acc.is_placeholder ?? false,
        is_active: acc.is_active ?? true,
        balance: acc.balance ?? 0,
        account_types: acc.account_types,
      }));
  };

  // Fetch accounts from database for modal
  const fetchAccountsForModal = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
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
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      // Normalize the database response
      const normalizedAccounts = normalizeAccounts(data || []);
      setAccounts(normalizedAccounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  // Fetch tags from database for modal
  const fetchTagsForModal = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const handleTransactionAdded = () => {
    fetchAllTransactions();
    refetchStats(); // Refresh dashboard stats when new transaction is added
  };

  const handleAccountsRefresh = () => {
    fetchAccounts();
    fetchAccountsForModal();
    refetchStats(); // Refresh dashboard stats when accounts change
  };

  const handleTagsRefresh = () => {
    fetchTagsForModal();
  };

  if (loading) {
    return <FullScreenLoading text="Loading your dashboard..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">
            Please sign in to access your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.email}!
              </h1>
              <p className="text-gray-600">
                Here&rsquo;s an overview of your financial data.
              </p>
            </div>
            <div className="flex gap-3">
              <AddTransactionModal
                userId={user.id}
                accounts={accounts}
                tags={tags}
                onTransactionAdded={handleTransactionAdded}
                onAccountsRefresh={handleAccountsRefresh}
                onTagsRefresh={handleTagsRefresh}
              />
            </div>
          </div>

          {/* Quick Stats - Full Width */}
          {statsError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">
                Error loading dashboard statistics: {statsError}
              </p>
            </div>
          ) : (
            <StatsCards
              totalBalance={stats.totalBalance}
              income={stats.income}
              expenses={stats.expenses}
              netWorth={stats.netWorth}
              assets={stats.assets}
              liabilities={stats.liabilities}
              totalInvestments={stats.totalInvestments}
              totalInvested={stats.totalInvested}
              unrealizedProfit={stats.unrealizedProfit}
              unrealizedProfitPercentage={stats.unrealizedProfitPercentage}
              loading={statsLoading}
            />
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            {/* Left Column - Accounts Tree View (30-40%) */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">
                      Chart of Accounts
                    </h2>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Double Entry
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <ChartOfAccounts showHeader={false} maxHeight="h-[500px]" />
                </div>
              </div>
            </div>

            {/* Right Column - Recent Transactions (60-70%) */}
            <div className="lg:col-span-6">
              <TransactionList
                transactions={transactions.slice(0, 5)} // Show only 5 recent transactions
                getTransactionType={getTransactionType}
                loading={transactionsLoading}
                title="Recent Transactions"
                showViewAllLink={true}
                viewAllHref="/transactions"
              />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<FullScreenLoading text="Loading dashboard..." />}>
      <DashboardContent />
    </Suspense>
  );
}