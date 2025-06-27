"use client";

import { useState, useMemo } from "react";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionSearchFilters } from "./TransactionSearchFilters";
import { TransactionListItem } from "./TransactionListItem";
import { TransactionData, TransactionType } from "@/types/transaction";
import Link from "next/link";

interface TransactionListProps {
  transactions: TransactionData[];
  getTransactionType: (transaction: TransactionData) => TransactionType;
  loading?: boolean;
  title?: string;
  showViewAllLink?: boolean;
  viewAllHref?: string;
}

export const TransactionList = ({
  transactions,
  getTransactionType,
  loading = false,
  title = "Recent Transactions",
  showViewAllLink = false,
  viewAllHref = "/transactions",
}: TransactionListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
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

  const handleSortOrderToggle = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {showViewAllLink && (
              <Link href={viewAllHref}>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            )}
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {showViewAllLink && (
            <Link href={viewAllHref}>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          )}
        </div>

        {/* Search and Sort Controls */}
        <TransactionSearchFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderToggle={handleSortOrderToggle}
        />
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {filteredAndSortedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm.trim()
                  ? "No transactions found matching your search"
                  : "No transactions found"}
              </p>
              <p className="text-sm text-gray-400">
                {searchTerm.trim()
                  ? "Try adjusting your search terms"
                  : "Start by adding some transactions"}
              </p>
            </div>
          ) : (
            filteredAndSortedTransactions.map((transaction) => (
              <TransactionListItem
                key={transaction.id}
                transaction={transaction}
                transactionType={getTransactionType(transaction)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
