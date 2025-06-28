import { supabase } from "./supabase";
import { Account, TransactionEntry, TransactionEntryInput } from "./types";

export class AccountingEngine {
  // Validate double-entry (total inflows = total outflows)
  static validateTransaction(
    entries: TransactionEntryInput[] | TransactionEntry[]
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
    entries: TransactionEntryInput[] | TransactionEntry[]
  ): number {
    return entries.reduce((sum, entry) => sum + entry.amount, 0) / 2; // Divide by 2 since each transaction has equal debits and credits
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
