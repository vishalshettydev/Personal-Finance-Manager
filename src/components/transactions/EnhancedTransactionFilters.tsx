"use client";

import { Search, Calendar, SortAsc, SortDesc, Filter } from "lucide-react";
import {
  DateRange,
  SortBy,
  SortOrder,
} from "@/hooks/useTransactionsWithPagination";

interface EnhancedTransactionFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  customDateRange: { start: string; end: string };
  onCustomDateRangeChange: (range: { start: string; end: string }) => void;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortChange: (by: SortBy, order: SortOrder) => void;
  totalCount: number;
}

export const EnhancedTransactionFilters = ({
  searchTerm,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  customDateRange,
  onCustomDateRangeChange,
  sortBy,
  sortOrder,
  onSortChange,
  totalCount,
}: EnhancedTransactionFiltersProps) => {
  const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
    { value: "custom", label: "Custom Range" },
  ];

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: "date", label: "Date" },
    { value: "amount", label: "Amount" },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <span className="text-sm text-gray-500">
          {totalCount} transaction{totalCount !== 1 ? "s" : ""} found
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Search</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search transactions..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Date Range
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value as DateRange)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm appearance-none bg-white"
            >
              {dateRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortBy, sortOrder)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm appearance-none bg-white"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Sort Order
          </label>
          <button
            onClick={() =>
              onSortChange(sortBy, sortOrder === "asc" ? "desc" : "asc")
            }
            className="flex items-center space-x-2 w-full px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            {sortOrder === "asc" ? (
              <SortAsc className="h-4 w-4 text-gray-500" />
            ) : (
              <SortDesc className="h-4 w-4 text-gray-500" />
            )}
            <span className="text-gray-700">
              {sortOrder === "asc" ? "Ascending" : "Descending"}
            </span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Inputs */}
      {dateRange === "custom" && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) =>
                  onCustomDateRangeChange({
                    ...customDateRange,
                    start: e.target.value,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) =>
                  onCustomDateRangeChange({
                    ...customDateRange,
                    end: e.target.value,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
