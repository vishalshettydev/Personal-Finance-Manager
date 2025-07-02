"use client";

import { TrendingUp, TrendingDown, ChevronRight, Split } from "lucide-react";
import { formatINR, formatRelativeDate } from "@/utils/formatters";
import { TransactionData, TransactionType } from "@/types/transaction";
import { TransactionTags } from "./TransactionTags";
import { AccountingEngine } from "@/lib/accounting";

interface TransactionListItemProps {
  transaction: TransactionData;
  transactionType: TransactionType;
  contextAccountId?: string; // If viewing from a specific account context
}

export const TransactionListItem = ({
  transaction,
  transactionType,
  contextAccountId,
}: TransactionListItemProps) => {
  const isIncome = transactionType === "income";
  const isExpense = transactionType === "expense";
  const isTransfer = transactionType === "transfer";
  const isSplitTransaction = transaction.is_split;

  // Get relevant entries based on context
  const getRelevantEntriesAndAmount = () => {
    if (contextAccountId && isSplitTransaction) {
      // When viewing from specific account context, show only relevant entries
      return AccountingEngine.getTransactionEntriesForAccount(
        transaction,
        contextAccountId
      );
    }

    // Default view - show all entries
    return {
      relevantEntries: transaction.transaction_entries,
      displayAmount: transaction.total_amount,
      isPartialView: false,
    };
  };

  const { relevantEntries, displayAmount, isPartialView } =
    getRelevantEntriesAndAmount();

  // Get debit and credit entries for display
  const debitEntries =
    relevantEntries?.filter((entry) => entry.entry_side === "DEBIT") || [];
  const creditEntries =
    relevantEntries?.filter((entry) => entry.entry_side === "CREDIT") || [];

  // Get account display text based on transaction type and split status
  const getAccountDisplayText = () => {
    if (isSplitTransaction && contextAccountId) {
      // For split transactions viewed from account context, show "Split" indicator
      const contextEntry = relevantEntries?.find(
        (entry) => entry.account_id === contextAccountId
      );
      if (contextEntry) {
        return `Split Transaction - ${
          contextEntry.description || transaction.description
        }`;
      }
    }

    if (isSplitTransaction && !contextAccountId) {
      // Full split transaction view - show primary account and split indicator
      const primaryEntry = transaction.transaction_entries?.find(
        (entry) => entry.line_number === 1
      );
      const splitCount = transaction.transaction_entries?.length - 1 || 0;

      if (primaryEntry) {
        return `${
          primaryEntry.accounts?.name || "Unknown Account"
        } → Split (${splitCount} entries)`;
      }
      return `Split Transaction (${
        transaction.transaction_entries?.length || 0
      } entries)`;
    }

    if (isTransfer) {
      // For regular transfers: From Account → To Account
      const fromAccount = debitEntries[0]?.accounts?.name || "Unknown Account";
      const toAccount = creditEntries[0]?.accounts?.name || "Unknown Account";
      return `${fromAccount} → ${toAccount}`;
    } else if (isIncome) {
      // For income: Income Source → Destination Account
      const incomeSource = debitEntries[0]?.accounts?.name || "Income Source";
      const destinationAccount = creditEntries[0]?.accounts?.name || "Account";
      return `${incomeSource} → ${destinationAccount}`;
    } else {
      // For expense: Source Account → Expense Account
      const sourceAccount = debitEntries[0]?.accounts?.name || "Account";
      const expenseAccount = creditEntries[0]?.accounts?.name || "Expense";
      return `${sourceAccount} → ${expenseAccount}`;
    }
  };

  // Get transaction type label
  const getTransactionTypeLabel = (type: TransactionType): string => {
    const baseLabel = (() => {
      switch (type) {
        case "income":
          return "Income";
        case "expense":
          return "Expense";
        case "transfer":
          return "Transfer";
        default:
          return "Transaction";
      }
    })();

    if (isSplitTransaction) {
      return `${baseLabel} (Split)`;
    }

    return baseLabel;
  };

  // Determine amount display color and prefix
  const getAmountDisplayInfo = () => {
    if (contextAccountId && isSplitTransaction) {
      // For split transactions in account context, determine sign based on the relevant entry
      const contextEntry = relevantEntries?.find(
        (entry) => entry.account_id === contextAccountId
      );
      if (contextEntry) {
        const isPositive = contextEntry.entry_side === "CREDIT";
        return {
          color: isPositive ? "text-green-600" : "text-red-600",
          prefix: isPositive ? "+" : "-",
          amount: displayAmount,
        };
      }
    }

    // Default amount display logic
    return {
      color: isIncome
        ? "text-green-600"
        : isExpense
        ? "text-red-600"
        : "text-blue-600",
      prefix: isIncome ? "+" : isExpense ? "-" : "",
      amount: displayAmount,
    };
  };

  const amountInfo = getAmountDisplayInfo();

  return (
    <div className="flex justify-between items-center py-3 border-b hover:bg-gray-50 rounded-lg px-3 transition-colors">
      <div className="flex items-center">
        <div
          className={`p-2 rounded-full mr-4 ${
            isSplitTransaction
              ? "bg-purple-100"
              : isIncome
              ? "bg-green-100"
              : isExpense
              ? "bg-red-100"
              : "bg-blue-100"
          }`}
        >
          {isSplitTransaction ? (
            <Split className="h-4 w-4 text-purple-600" />
          ) : isIncome ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : isExpense ? (
            <TrendingDown className="h-4 w-4 text-red-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-blue-600" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">{transaction.description}</p>
          <p className="text-sm text-gray-500">
            {getAccountDisplayText()} •{" "}
            {formatRelativeDate(transaction.transaction_date)}
          </p>
          {transaction.reference_number && (
            <p className="text-xs text-gray-400">
              Ref: {transaction.reference_number}
            </p>
          )}
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-400">
              {getTransactionTypeLabel(transactionType)}
            </p>
            {isPartialView && (
              <span className="text-xs text-purple-600 bg-purple-100 px-1 rounded">
                Partial View
              </span>
            )}
          </div>
          {/* Display tags */}
          <TransactionTags
            tags={transaction.transaction_tags?.map((tt) => tt.tags) || []}
            size="sm"
            maxVisible={3}
          />

          {/* Show split details in full view */}
          {isSplitTransaction && !contextAccountId && (
            <div className="mt-1 text-xs text-gray-500">
              <div className="space-y-1">
                {transaction.transaction_entries
                  ?.sort((a, b) => (a.line_number || 0) - (b.line_number || 0))
                  .map((entry, index) => (
                    <div key={entry.id} className="flex justify-between">
                      <span className="truncate max-w-48">
                        {index === 0 ? "From" : "To"}:{" "}
                        {entry.accounts?.name || "Unknown"}
                      </span>
                      <span>{formatINR(entry.amount || 0)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <span className={`font-semibold ${amountInfo.color}`}>
        {amountInfo.prefix}
        {formatINR(amountInfo.amount)}
      </span>
    </div>
  );
};
