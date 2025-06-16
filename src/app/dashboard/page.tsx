"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import ChartOfAccounts from "@/components/ChartOfAccounts";
import { TransactionList } from "@/components/transactions/TransactionList";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { FullScreenLoading } from "@/components/common/LoadingSpinner";

export default function Dashboard() {
  const { user, loading, initialize } = useAuthStore();

  // Custom hooks for data management
  const {
    transactions,
    loading: transactionsLoading,
    getTransactionType,
    fetchAllTransactions,
  } = useTransactions(user?.id || null);

  const { fetchAccounts } = useAccounts(user?.id || null);

  useEffect(() => {
    if (!user && loading) {
      initialize();
    }
  }, [user, loading, initialize]);

  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchAllTransactions();
    }
  }, [user, fetchAccounts, fetchAllTransactions]);

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
                Here&apos;s an overview of your financial data.
              </p>
            </div>
          </div>

          {/* Quick Stats - Full Width */}
          <StatsCards />

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
