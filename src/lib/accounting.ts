import { supabase } from "./supabase";
import { Account, TransactionEntry, TransactionEntryInput } from "./types";

export class AccountingEngine {
  // Validate double-entry (debits = credits)
  static validateTransaction(
    entries: TransactionEntryInput[] | TransactionEntry[]
  ): boolean {
    const totalDebits = entries.reduce(
      (sum, entry) => sum + entry.debit_amount,
      0
    );
    const totalCredits = entries.reduce(
      (sum, entry) => sum + entry.credit_amount,
      0
    );
    return Math.abs(totalDebits - totalCredits) < 0.01; // Handle floating point precision
  }

  // Calculate total amount for transaction
  static calculateTransactionTotal(
    entries: TransactionEntryInput[] | TransactionEntry[]
  ): number {
    return entries.reduce(
      (sum, entry) => sum + Math.max(entry.debit_amount, entry.credit_amount),
      0
    );
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

      if (account && account.account_type) {
        const isDebitAccount = account.account_type.category === "DEBIT";
        const balanceChange = isDebitAccount
          ? entry.debit_amount - entry.credit_amount
          : entry.credit_amount - entry.debit_amount;

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
