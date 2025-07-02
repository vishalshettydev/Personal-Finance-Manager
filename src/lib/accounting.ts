import { supabase } from "./supabase";
import { Account, TransactionEntry, TransactionEntryInput } from "./types";
import { SplitEntry } from "@/types/transaction";

export class AccountingEngine {
  // Validate double-entry (total inflows = total outflows)
  static validateTransaction(
    entries: TransactionEntryInput[] | TransactionEntry[] | SplitEntry[]
  ): boolean {
    const totalCredits = entries
      .filter((entry) => entry.entry_type === "CREDIT")
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalDebits = entries
      .filter((entry) => entry.entry_type === "DEBIT")
      .reduce((sum, entry) => sum + entry.amount, 0);

    return Math.abs(totalDebits - totalCredits) < 0.01; // Handle floating point precision
  }

  // Calculate total amount for transaction
  static calculateTransactionTotal(
    entries: TransactionEntryInput[] | TransactionEntry[] | SplitEntry[]
  ): number {
    return entries.reduce((sum, entry) => sum + entry.amount, 0) / 2; // Divide by 2 since each transaction has equal debits and credits
  }

  // Validate split transaction structure
  static validateSplitTransaction(
    primaryEntry: SplitEntry,
    splitEntries: SplitEntry[]
  ): { isValid: boolean; error?: string } {
    // Must have at least one split entry
    if (splitEntries.length === 0) {
      return {
        isValid: false,
        error: "Split transaction must have at least one split entry",
      };
    }

    // Primary entry and split entries must be opposite types
    const primaryType = primaryEntry.entry_type;
    const splitTypes = splitEntries.map((entry) => entry.entry_type);

    // All split entries must be the same type (opposite of primary)
    const expectedSplitType = primaryType === "DEBIT" ? "CREDIT" : "DEBIT";
    const allSplitsSameType = splitTypes.every(
      (type) => type === expectedSplitType
    );

    if (!allSplitsSameType) {
      return {
        isValid: false,
        error: `All split entries must be ${expectedSplitType} when primary is ${primaryType}`,
      };
    }

    // Amounts must balance
    const primaryAmount = primaryEntry.amount;
    const totalSplitAmount = splitEntries.reduce(
      (sum, entry) => sum + entry.amount,
      0
    );

    if (Math.abs(primaryAmount - totalSplitAmount) > 0.01) {
      return {
        isValid: false,
        error: "Primary entry amount must equal sum of split entries",
      };
    }

    // All amounts must be positive
    if (primaryAmount <= 0 || splitEntries.some((entry) => entry.amount <= 0)) {
      return { isValid: false, error: "All amounts must be greater than zero" };
    }

    // No duplicate accounts
    const allAccountIds = [
      primaryEntry.account_id,
      ...splitEntries.map((entry) => entry.account_id),
    ];
    const uniqueAccountIds = new Set(allAccountIds);
    if (allAccountIds.length !== uniqueAccountIds.size) {
      return {
        isValid: false,
        error:
          "Cannot use the same account multiple times in a split transaction",
      };
    }

    return { isValid: true };
  }

  // Convert split transaction to transaction entries
  static convertSplitToEntries(
    primaryEntry: SplitEntry,
    splitEntries: SplitEntry[]
  ): Omit<TransactionEntryInput, "transaction_id">[] {
    const entries: Omit<TransactionEntryInput, "transaction_id">[] = [];

    // Add primary entry (line 1)
    entries.push({
      account_id: primaryEntry.account_id,
      amount: primaryEntry.amount,
      entry_type: primaryEntry.entry_type,
      quantity: 1,
      price: primaryEntry.amount,
      description: primaryEntry.description,
      line_number: 1,
    });

    // Add split entries (line 2, 3, ...)
    splitEntries.forEach((splitEntry, index) => {
      entries.push({
        account_id: splitEntry.account_id,
        amount: splitEntry.amount,
        entry_type: splitEntry.entry_type,
        quantity: 1,
        price: splitEntry.amount,
        description: splitEntry.description,
        line_number: index + 2,
      });
    });

    return entries;
  }

  // Update account balances after transaction
  static async updateAccountBalances(
    entries: (TransactionEntryInput & { transaction_id: string })[]
  ) {
    for (const entry of entries) {
      const { data: account } = await supabase
        .from("accounts")
        .select(
          `
          *,
          account_type:account_types(*)
        `
        )
        .eq("id", entry.account_id)
        .single();

      if (account) {
        // Apply simplified logic: CREDIT = money deposited (+), DEBIT = money withdrawn (-)
        const balanceChange =
          entry.entry_type === "CREDIT" ? entry.amount : -entry.amount;

        await supabase
          .from("accounts")
          .update({
            balance: (account.balance ?? 0) + balanceChange,
            updated_at: new Date().toISOString(),
          })
          .eq("id", entry.account_id);
      }
    }
  }

  // Get transaction entries filtered by account (for account-specific views)
  static getTransactionEntriesForAccount(
    transaction: {
      id: string;
      description: string;
      total_amount: number;
      is_split: boolean | null;
      transaction_entries: import("@/types/transaction").TransactionEntry[];
    },
    accountId: string
  ): {
    relevantEntries: import("@/types/transaction").TransactionEntry[];
    displayAmount: number;
    isPartialView: boolean;
  } {
    const relevantEntries = transaction.transaction_entries.filter(
      (entry) => entry.account_id === accountId
    );

    // For split transactions, if viewing from an account perspective,
    // only show entries relevant to that account
    if (transaction.is_split && relevantEntries.length > 0) {
      const displayAmount = relevantEntries.reduce(
        (sum, entry) => sum + (entry.amount || 0),
        0
      );
      return {
        relevantEntries,
        displayAmount,
        isPartialView:
          transaction.transaction_entries.length > relevantEntries.length,
      };
    }

    // For non-split or when viewing all entries
    return {
      relevantEntries: transaction.transaction_entries,
      displayAmount: transaction.total_amount,
      isPartialView: false,
    };
  }

  // Generate Balance Sheet data
  static generateBalanceSheet(accounts: Account[]) {
    const assets = accounts.filter((a) => a.account_type?.name === "Assets");
    const liabilities = accounts.filter(
      (a) => a.account_type?.name === "Liabilities"
    );
    const equity = accounts.filter((a) => a.account_type?.name === "Equity");

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce(
      (sum, a) => sum + Math.abs(a.balance),
      0
    );
    const totalEquity = equity.reduce((sum, a) => sum + Math.abs(a.balance), 0);

    return {
      assets: { accounts: assets, total: totalAssets },
      liabilities: { accounts: liabilities, total: totalLiabilities },
      equity: { accounts: equity, total: totalEquity },
      netWorth: totalAssets - totalLiabilities,
    };
  }

  // Generate Income Statement data
  static generateIncomeStatement(accounts: Account[]) {
    const income = accounts.filter((a) => a.account_type?.name === "Income");
    const expenses = accounts.filter(
      (a) => a.account_type?.name === "Expenses"
    );

    const totalIncome = income.reduce((sum, a) => sum + Math.abs(a.balance), 0);
    const totalExpenses = expenses.reduce((sum, a) => sum + a.balance, 0);

    return {
      income: { accounts: income, total: totalIncome },
      expenses: { accounts: expenses, total: totalExpenses },
      netIncome: totalIncome - totalExpenses,
    };
  }
}
