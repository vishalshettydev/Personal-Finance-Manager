"use client";

import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TransactionSearchFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: "date" | "amount";
  onSortByChange: (value: "date" | "amount") => void;
  sortOrder: "asc" | "desc";
  onSortOrderToggle: () => void;
}

export const TransactionSearchFilters = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderToggle,
}: TransactionSearchFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search transactions..."
          className="pl-10 h-9"
        />
      </div>

      <div className="flex gap-2">
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as "date" | "amount")}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white"
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
        </select>

        <Button
          variant="outline"
          size="sm"
          onClick={onSortOrderToggle}
          className="px-2"
        >
          {sortOrder === "desc" ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4 rotate-180" />
          )}
        </Button>
      </div>
    </div>
  );
};
