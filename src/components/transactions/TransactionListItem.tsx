"use client";

import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { formatINR, formatRelativeDate } from "@/utils/formatters";
import { TransactionData, TransactionType } from "@/types/transaction";
import { TransactionTags } from "./TransactionTags";

interface TransactionListItemProps {
  transaction: TransactionData;
  transactionType: TransactionType;
}

export const TransactionListItem = ({
  transaction,
  transactionType,
}: TransactionListItemProps) => {
  const isIncome = transactionType === "income";
  const isExpense = transactionType === "expense";
  const isTransfer = transactionType === "transfer";

  const amount = transaction.total_amount;

  // Get debit and credit entries for display
  const debitEntry = transaction.transaction_entries?.find(
    (entry) => (entry.debit_amount || 0) > 0
  );
  const creditEntry = transaction.transaction_entries?.find(
    (entry) => (entry.credit_amount || 0) > 0
  );

  // Get account display text based on transaction type
  const getAccountDisplayText = () => {
    if (isTransfer) {
      // For transfers, show: From Account → To Account
      // The account that was debited (money taken from) → account that was credited (money added to)
      const fromAccount = creditEntry?.accounts?.name || "Unknown Account";
      const toAccount = debitEntry?.accounts?.name || "Unknown Account";
      return `${fromAccount} → ${toAccount}`;
    } else if (isIncome) {
      // For income, show the income source (credit) and where it went (debit)
      const incomeSource = creditEntry?.accounts?.name || "Income Source";
      const destinationAccount = debitEntry?.accounts?.name || "Account";
      return `${incomeSource} → ${destinationAccount}`;
    } else {
      // For expense, show where money came from (credit) and what it was spent on (debit)
      const sourceAccount = creditEntry?.accounts?.name || "Account";
      const expenseAccount = debitEntry?.accounts?.name || "Expense";
      return `${sourceAccount} → ${expenseAccount}`;
    }
  };

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
            {getAccountDisplayText()} •{" "}
            {formatRelativeDate(transaction.transaction_date)}
          </p>
          {transaction.reference_number && (
            <p className="text-xs text-gray-400">
              Ref: {transaction.reference_number}
            </p>
          )}
          <p className="text-xs text-gray-400">
            {getTransactionTypeLabel(transactionType)}
          </p>
          {/* Display tags */}
          <TransactionTags
            tags={transaction.transaction_tags?.map((tt) => tt.tags) || []}
            size="sm"
            maxVisible={3}
          />
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
