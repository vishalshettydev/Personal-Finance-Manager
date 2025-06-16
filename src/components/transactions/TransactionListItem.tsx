"use client";

import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { formatINR, formatRelativeDate } from "@/utils/formatters";
import { TransactionData, TransactionType } from "@/types/transaction";

interface TransactionListItemProps {
  transaction: TransactionData;
  transactionType: TransactionType;
}

export const TransactionListItem = ({
  transaction,
  transactionType,
}: TransactionListItemProps) => {
  // Find the primary account for display
  let primaryEntry: TransactionData["transaction_entries"][0] | undefined,
    secondaryEntry: TransactionData["transaction_entries"][0] | undefined;

  if (transactionType === "transfer") {
    // For transfers, show both accounts
    const assetLiabilityEntries = transaction.transaction_entries.filter(
      (entry) =>
        ["ASSET", "LIABILITY"].includes(
          entry.accounts?.account_types?.category || ""
        )
    );
    primaryEntry = assetLiabilityEntries[0];
    secondaryEntry = assetLiabilityEntries[1];
  } else {
    // For income/expense, find the income/expense entry
    primaryEntry = transaction.transaction_entries.find(
      (entry) =>
        entry.accounts?.account_types?.category === "INCOME" ||
        entry.accounts?.account_types?.category === "EXPENSE"
    );
    // Get the other account (asset/liability) for display
    secondaryEntry = transaction.transaction_entries.find(
      (entry) => entry.id !== primaryEntry?.id
    );
  }

  const isIncome = transactionType === "income";
  const isExpense = transactionType === "expense";
  const isTransfer = transactionType === "transfer";

  const amount = transaction.total_amount;

  // Get transaction type label
  const getTransactionTypeLabel = (type: TransactionType): string => {
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
  };

  return (
    <div className="flex justify-between items-center py-3 border-b hover:bg-gray-50 rounded-lg px-3 transition-colors">
      <div className="flex items-center">
        <div
          className={`p-2 rounded-full mr-4 ${
            isIncome ? "bg-green-100" : isExpense ? "bg-red-100" : "bg-blue-100"
          }`}
        >
          {isIncome ? (
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
            {isTransfer ? (
              <>
                {primaryEntry?.accounts?.name || "Account"} →{" "}
                {secondaryEntry?.accounts?.name || "Account"}
              </>
            ) : (
              <>{secondaryEntry?.accounts?.name || "Account"}</>
            )}{" "}
            • {formatRelativeDate(transaction.transaction_date)}
          </p>
          {transaction.reference_number && (
            <p className="text-xs text-gray-400">
              Ref: {transaction.reference_number}
            </p>
          )}
          <p className="text-xs text-gray-400">
            {getTransactionTypeLabel(transactionType)}
          </p>
        </div>
      </div>
      <span
        className={`font-semibold ${
          isIncome
            ? "text-green-600"
            : isExpense
            ? "text-red-600"
            : "text-blue-600"
        }`}
      >
        {isIncome ? "+" : isExpense ? "-" : ""}
        {formatINR(amount)}
      </span>
    </div>
  );
};
