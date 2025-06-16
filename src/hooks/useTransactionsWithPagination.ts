import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  DatabaseTransactionWithEntries,
  TransactionType,
} from "@/types/transaction";
import { handleDatabaseError } from "@/utils/api";

export type DateRange =
  | "today"
  | "week"
  | "month"
  | "quarter"
  | "year"
  | "custom";
export type SortBy = "date" | "amount";
export type SortOrder = "asc" | "desc";

interface DateRangeValue {
  start: string;
  end: string;
}

export const useTransactionsWithPagination = (userId: string | null) => {
  const [transactions, setTransactions] = useState<
    DatabaseTransactionWithEntries[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("month");
  const [customDateRange, setCustomDateRange] = useState<DateRangeValue>({
    start: "",
    end: "",
  });
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [error, setError] = useState<string | null>(null);

  // Calculate date range based on selection
  const getDateRangeFilter = useCallback(
    (range: DateRange, customRange?: DateRangeValue) => {
      const now = new Date();
      const start = new Date();

      if (range === "custom" && customRange?.start && customRange?.end) {
        return {
          start: customRange.start,
          end: customRange.end,
        };
      }

      switch (range) {
        case "today":
          start.setHours(0, 0, 0, 0);
          return {
            start: start.toISOString().split("T")[0],
            end: now.toISOString().split("T")[0],
          };
        case "week":
          start.setDate(now.getDate() - 7);
          break;
        case "month":
          start.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          start.setMonth(now.getMonth() - 3);
          break;
        case "year":
          start.setFullYear(now.getFullYear() - 1);
          break;
      }

      return {
        start: start.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      };
    },
    []
  );

  // Fetch transactions with pagination and filters
  const fetchTransactions = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { start, end } = getDateRangeFilter(dateRange, customDateRange);

      // Build query
      let query = supabase
        .from("transactions")
        .select(
          `
          *,
          entries (
            id,
            amount,
            is_debit,
            description,
            account:accounts (
              id,
              name,
              type
            )
          )
        `,
          { count: "exact" }
        )
        .eq("user_id", userId)
        .gte("transaction_date", start)
        .lte("transaction_date", end);

      // Add search filter
      if (searchTerm) {
        query = query.or(
          `description.ilike.%${searchTerm}%,entries.description.ilike.%${searchTerm}%`
        );
      }

      // Add sorting
      query = query.order(
        sortBy === "date" ? "transaction_date" : "total_amount",
        {
          ascending: sortOrder === "asc",
        }
      );

      // Add pagination
      const startIndex = (currentPage - 1) * pageSize;
      query = query.range(startIndex, startIndex + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setTransactions(
        (data as unknown as DatabaseTransactionWithEntries[]) || []
      );
      setTotalCount(count || 0);
    } catch (error) {
      const errorMessage = handleDatabaseError(error, "fetch transactions");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    userId,
    currentPage,
    pageSize,
    searchTerm,
    dateRange,
    customDateRange,
    sortBy,
    sortOrder,
    getDateRangeFilter,
  ]);

  // Get transaction type (income/expense/transfer)
  const getTransactionType = useCallback(
    (transaction: DatabaseTransactionWithEntries): TransactionType => {
      if (!transaction.entries || transaction.entries.length === 0) {
        return "transfer";
      }

      const accountTypes = transaction.entries
        .map((entry) => entry.account?.type)
        .filter((type): type is string => Boolean(type));
      const uniqueTypes = [...new Set(accountTypes)];

      if (uniqueTypes.includes("Income")) return "income";
      if (uniqueTypes.includes("Expense")) return "expense";
      if (uniqueTypes.includes("Asset") || uniqueTypes.includes("Liability"))
        return "transfer";

      return "transfer";
    },
    []
  );

  // Pagination helpers
  const totalPages = useMemo(
    () => Math.ceil(totalCount / pageSize),
    [totalCount, pageSize]
  );

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  // Filter handlers
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page
  }, []);

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
    setCurrentPage(1); // Reset to first page
  }, []);

  const handleCustomDateRangeChange = useCallback(
    (range: DateRangeValue) => {
      setCustomDateRange(range);
      if (dateRange === "custom") {
        setCurrentPage(1); // Reset to first page
      }
    },
    [dateRange]
  );

  const handleSortChange = useCallback((by: SortBy, order: SortOrder) => {
    setSortBy(by);
    setSortOrder(order);
    setCurrentPage(1); // Reset to first page
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page
  }, []);

  return {
    // Data
    transactions,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage,
    pageSize,

    // Filters
    searchTerm,
    dateRange,
    customDateRange,
    sortBy,
    sortOrder,

    // Actions
    fetchTransactions,
    getTransactionType,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    handleSearch,
    handleDateRangeChange,
    handleCustomDateRangeChange,
    handleSortChange,
    handlePageSizeChange,

    // Utils
    refetch: fetchTransactions,
  };
};
