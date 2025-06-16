"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TransactionListItem } from "@/components/transactions/TransactionListItem";
import { EnhancedTransactionFilters } from "@/components/transactions/EnhancedTransactionFilters";
import { Pagination } from "@/components/common/Pagination";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import {
  FullScreenLoading,
  ListItemSkeleton,
} from "@/components/common/LoadingSpinner";
import { useTransactions } from "@/hooks/useTransactions";
import { Receipt, AlertCircle } from "lucide-react";

export default function TransactionsPage() {
  const { user, loading, initialize } = useAuthStore();

  // Use the original transactions hook for now (we can integrate pagination later)
  const {
    transactions,
    loading: transactionsLoading,
    getTransactionType,
    fetchAllTransactions,
  } = useTransactions(user?.id || null);

  // Mock pagination state for now
  const currentPage = 1;
  const totalPages = Math.ceil(transactions.length / 10);
  const pageSize = 10;
  const totalCount = transactions.length;

  // Mock filter states
  const searchTerm = "";
  const dateRange = "month" as const;
  const customDateRange = { start: "", end: "" };
  const sortBy = "date" as const;
  const sortOrder = "desc" as const;

  useEffect(() => {
    if (!user && loading) {
      initialize();
    }
  }, [user, loading, initialize]);

  useEffect(() => {
    if (user) {
      fetchAllTransactions();
    }
  }, [user, fetchAllTransactions]);

  // Mock handlers (we'll implement these properly later)
  const handleSearch = (term: string) => {
    console.log("Search:", term);
  };

  const handleDateRangeChange = (range: string) => {
    console.log("Date range change:", range);
  };

  const handleCustomDateRangeChange = (range: {
    start: string;
    end: string;
  }) => {
    console.log("Custom date range change:", range);
  };

  const handleSortChange = (by: string, order: string) => {
    console.log("Sort change:", by, order);
  };

  const handlePageChange = (page: number) => {
    console.log("Page change:", page);
  };

  const handlePageSizeChange = (size: number) => {
    console.log("Page size change:", size);
  };

  const handlePreviousPage = () => {
    console.log("Previous page");
  };

  const handleNextPage = () => {
    console.log("Next page");
  };

  if (loading) {
    return <FullScreenLoading text="Loading transactions..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">
            Please sign in to access your transactions.
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
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Receipt className="h-8 w-8 mr-3 text-indigo-600" />
                Transactions
              </h1>
              <p className="text-gray-600 mt-2">
                View and manage all your financial transactions with advanced
                filtering and search.
              </p>
            </div>
          </div>

          {/* Enhanced Filters */}
          <EnhancedTransactionFilters
            searchTerm={searchTerm}
            onSearchChange={handleSearch}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            customDateRange={customDateRange}
            onCustomDateRangeChange={handleCustomDateRangeChange}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            totalCount={totalCount}
          />

          {/* Transactions List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  All Transactions
                </h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {totalCount} total
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {transactionsLoading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <ListItemSkeleton key={index} />
                ))
              ) : transactions.length === 0 ? (
                // Empty state
                <div className="p-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No transactions found
                  </h3>
                  <p className="text-gray-600">
                    No transactions match your current filters. Try adjusting
                    your search criteria.
                  </p>
                </div>
              ) : (
                // Transaction items
                transactions
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((transaction) => (
                    <TransactionListItem
                      key={transaction.id}
                      transaction={transaction}
                      transactionType={getTransactionType(transaction)}
                    />
                  ))
              )}
            </div>

            {/* Pagination */}
            {!transactionsLoading && transactions.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onPreviousPage={handlePreviousPage}
                onNextPage={handleNextPage}
              />
            )}
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">
                      ↑
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Income Transactions
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {
                      transactions.filter(
                        (t) => getTransactionType(t) === "income"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-semibold text-sm">
                      ↓
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Expense Transactions
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {
                      transactions.filter(
                        (t) => getTransactionType(t) === "expense"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      ↔
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Transfer Transactions
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {
                      transactions.filter(
                        (t) => getTransactionType(t) === "transfer"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  );
}
