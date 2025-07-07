"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
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

function TransactionsContent() {
  const { user, loading, initialize } = useAuthStore();

  // Use the original transactions hook
  const {
    transactions,
    loading: transactionsLoading,
    getTransactionType,
    fetchAllTransactions,
  } = useTransactions(user?.id || null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("month" as const);
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  });
  const [sortBy, setSortBy] = useState("date" as const);
  const [sortOrder, setSortOrder] = useState("desc" as const);

  // Filter and paginate transactions
  const filteredAndPaginatedTransactions = useMemo(() => {
    let filtered = transactions;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = transactions.filter(
        (transaction) =>
          transaction.description.toLowerCase().includes(searchTermLower) ||
          transaction.reference_number
            ?.toLowerCase()
            .includes(searchTermLower) ||
          transaction.notes?.toLowerCase().includes(searchTermLower) ||
          transaction.transaction_entries?.some((entry) =>
            entry.accounts?.name?.toLowerCase().includes(searchTermLower)
          ) ||
          transaction.transaction_tags?.some((tagEntry) =>
            tagEntry.tags.name.toLowerCase().includes(searchTermLower)
          )
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.transaction_date).getTime();
        const dateB = new Date(b.transaction_date).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      } else if (sortBy === "amount") {
        const amountA = a.total_amount;
        const amountB = b.total_amount;
        return sortOrder === "desc" ? amountB - amountA : amountA - amountB;
      }
      return 0;
    });

    return sorted;
  }, [transactions, searchTerm, sortBy, sortOrder]);

  const totalCount = filteredAndPaginatedTransactions.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedTransactions = filteredAndPaginatedTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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

  // Real handlers for filters and pagination
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleDateRangeChange = (range: string) => {
    setDateRange(range as "month");
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleCustomDateRangeChange = (range: {
    start: string;
    end: string;
  }) => {
    setCustomDateRange(range);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSortChange = (by: string, order: string) => {
    setSortBy(by as "date");
    setSortOrder(order as "desc");
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
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
                paginatedTransactions.map((transaction) => (
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
                      filteredAndPaginatedTransactions.filter(
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
                      filteredAndPaginatedTransactions.filter(
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
                      filteredAndPaginatedTransactions.filter(
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

export default function TransactionsPage() {
  return (
    <Suspense fallback={<FullScreenLoading text="Loading transactions..." />}>
      <TransactionsContent />
    </Suspense>
  );
}