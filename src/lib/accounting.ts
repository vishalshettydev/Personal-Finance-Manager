import { supabase } from "./supabase";
import { Account, TransactionEntry, TransactionEntryInput } from "./types";
import { SplitEntry } from "@/types/transaction";

export class AccountingEngine {
  // Validate double-entry (total debits = total credits)
  static validateTransaction(
    entries: TransactionEntryInput[] | TransactionEntry[] | SplitEntry[]
  ): boolean {
    const totalCredits = entries
      .filter((entry) => entry.entry_side === "CREDIT")
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalDebits = entries
      .filter((entry) => entry.entry_side === "DEBIT")
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

    // Primary entry and split entries must be opposite sides
    const primarySide = primaryEntry.entry_side;
    const splitSides = splitEntries.map((entry) => entry.entry_side);

    // All split entries must be the same side (opposite of primary)
    const expectedSplitSide = primarySide === "DEBIT" ? "CREDIT" : "DEBIT";
    const allSplitsSameSide = splitSides.every(
      (side) => side === expectedSplitSide
    );

    if (!allSplitsSameSide) {
      return {
        isValid: false,
        error: `All split entries must be ${expectedSplitSide} when primary is ${primarySide}`,
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
      entry_side: primaryEntry.entry_side,
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
        entry_side: splitEntry.entry_side,
        quantity: 1,
        price: splitEntry.amount,
        description: splitEntry.description,
        line_number: index + 2,
      });
    });

    return entries;
  }

  // Calculate balance change based on account type and entry side
  static calculateBalanceChange(
    accountType: string,
    normalBalance: string,
    entrySide: string,
    amount: number
  ): number {
    // Follow accounting principles:
    // Asset accounts (DEBIT normal): DEBIT increases, CREDIT decreases
    // Liability accounts (CREDIT normal): DEBIT decreases, CREDIT increases
    // Expense accounts (DEBIT normal): DEBIT increases, CREDIT decreases
    // Income accounts (CREDIT normal): DEBIT decreases, CREDIT increases
    // Equity accounts (CREDIT normal): DEBIT decreases, CREDIT increases

    if (normalBalance === "DEBIT") {
      // DEBIT normal balance accounts: DEBIT increases (+), CREDIT decreases (-)
      return entrySide === "DEBIT" ? amount : -amount;
    } else {
      // CREDIT normal balance accounts: CREDIT increases (+), DEBIT decreases (-)
      return entrySide === "CREDIT" ? amount : -amount;
    }
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
        // Get account type information
        const accountType = account.account_type;
        if (!accountType) {
          console.error(
            `No account type found for account ${entry.account_id}`
          );
          continue;
        }

        // Calculate balance change using proper accounting principles
        const balanceChange = this.calculateBalanceChange(
          accountType.category,
          accountType.normal_balance,
          entry.entry_side,
          entry.amount
        );

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
      is_split: boolean | null | undefined;
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
    const assets = accounts.filter((a) => a.account_type?.category === "ASSET");
    const liabilities = accounts.filter(
      (a) => a.account_type?.category === "LIABILITY"
    );
    const equity = accounts.filter(
      (a) => a.account_type?.category === "EQUITY"
    );

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
    const income = accounts.filter(
      (a) => a.account_type?.category === "INCOME"
    );
    const expenses = accounts.filter(
      (a) => a.account_type?.category === "EXPENSE"
    );

    const totalIncome = income.reduce((sum, a) => sum + Math.abs(a.balance), 0);
    const totalExpenses = expenses.reduce((sum, a) => sum + a.balance, 0);

    return {
      income: { accounts: income, total: totalIncome },
      expenses: { accounts: expenses, total: totalExpenses },
      netIncome: totalIncome - totalExpenses,
    };
  }

  // FIFO Investment Lot Tracking
  static async calculateInvestmentFIFO(
    accountId: string,
    userId: string,
    saleQuantity: number,
    saleDate: string
  ): Promise<{
    fifoLots: Array<{
      purchaseDate: string;
      quantity: number;
      price: number;
      amount: number;
    }>;
    totalCostBasis: number;
    averageCostBasis: number;
  }> {
    // Get all purchase and sale entries for this investment account, ordered by date
    const { data: entries, error } = await supabase
      .from("transaction_entries")
      .select(
        `
        *,
        transactions!inner(transaction_date, user_id)
      `
      )
      .eq("account_id", accountId)
      .eq("transactions.user_id", userId)
      .lte("transactions.transaction_date", saleDate)
      .order("transactions.transaction_date", { ascending: true });

    if (error) {
      console.error("Error fetching investment entries for FIFO:", error);
      throw error;
    }

    // Build purchase lots using FIFO
    const purchaseLots: Array<{
      purchaseDate: string;
      quantity: number;
      price: number;
      amount: number;
      remainingQuantity: number;
    }> = [];

    // Process all entries chronologically
    entries?.forEach((entry) => {
      const date = entry.transactions.transaction_date;
      const quantity = entry.quantity || 0;
      const price = entry.price || 0;
      const amount = entry.amount || 0;
      const entrySide = entry.entry_side;

      if (entrySide === "DEBIT") {
        // Purchase - add new lot
        purchaseLots.push({
          purchaseDate: date,
          quantity,
          price,
          amount,
          remainingQuantity: quantity,
        });
      } else if (entrySide === "CREDIT" && quantity > 0) {
        // Sale - reduce lots using FIFO
        let saleQuantityRemaining = quantity;

        for (const lot of purchaseLots) {
          if (saleQuantityRemaining <= 0) break;

          const quantityToReduce = Math.min(
            saleQuantityRemaining,
            lot.remainingQuantity
          );
          lot.remainingQuantity -= quantityToReduce;
          saleQuantityRemaining -= quantityToReduce;
        }
      }
    });

    // Now calculate FIFO for the current sale
    const fifoLots: Array<{
      purchaseDate: string;
      quantity: number;
      price: number;
      amount: number;
    }> = [];

    let remainingSaleQuantity = saleQuantity;
    let totalCostBasis = 0;

    for (const lot of purchaseLots) {
      if (remainingSaleQuantity <= 0) break;
      if (lot.remainingQuantity <= 0) continue;

      const quantityFromThisLot = Math.min(
        remainingSaleQuantity,
        lot.remainingQuantity
      );
      const amountFromThisLot = quantityFromThisLot * lot.price;

      fifoLots.push({
        purchaseDate: lot.purchaseDate,
        quantity: quantityFromThisLot,
        price: lot.price,
        amount: amountFromThisLot,
      });

      totalCostBasis += amountFromThisLot;
      remainingSaleQuantity -= quantityFromThisLot;
    }

    const averageCostBasis =
      saleQuantity > 0 ? totalCostBasis / saleQuantity : 0;

    return {
      fifoLots,
      totalCostBasis,
      averageCostBasis,
    };
  }

  // Check if account is investment type
  static isInvestmentAccount(account: {
    account_types?: { name?: string };
  }): boolean {
    const accountType = account.account_types?.name?.toLowerCase() || "";
    return accountType === "mutual fund" || accountType === "stock";
  }

  // Process investment sale with FIFO and create gain/loss entries
  static async processInvestmentSaleWithFIFO(
    saleEntry: TransactionEntryInput & { transaction_id: string },
    transactionDate: string,
    userId: string
  ): Promise<void> {
    // Only process CREDIT entries to investment accounts (sales)
    if (saleEntry.entry_side !== "CREDIT") return;

    // Get account information
    const { data: account } = await supabase
      .from("accounts")
      .select(
        `
        *,
        account_types(*)
      `
      )
      .eq("id", saleEntry.account_id)
      .single();

    if (
      !account ||
      !account.account_types ||
      !this.isInvestmentAccount({ account_types: account.account_types })
    )
      return;

    const saleQuantity = saleEntry.quantity || 0;
    if (saleQuantity <= 0) return;

    try {
      // Calculate FIFO cost basis
      const fifoResult = await this.calculateInvestmentFIFO(
        saleEntry.account_id,
        userId,
        saleQuantity,
        transactionDate
      );

      // Calculate gain/loss
      const saleAmount = saleEntry.amount;
      const costBasis = fifoResult.totalCostBasis;
      const gainLoss = saleAmount - costBasis;

      if (Math.abs(gainLoss) > 0.01) {
        // Create gain/loss entry if significant
        // Find appropriate gain/loss account or create one
        let gainLossAccount;

        const accountName =
          gainLoss > 0 ? "Investment Gains" : "Investment Losses";
        const { data: existingAccount } = await supabase
          .from("accounts")
          .select("*")
          .eq("user_id", userId)
          .eq("name", accountName)
          .single();

        if (existingAccount) {
          gainLossAccount = existingAccount;
        } else {
          // Get the appropriate account type for gain/loss
          const { data: accountType } = await supabase
            .from("account_types")
            .select("*")
            .eq("name", gainLoss > 0 ? "Income" : "Expense")
            .single();

          if (accountType) {
            const { data: newAccount } = await supabase
              .from("accounts")
              .insert({
                user_id: userId,
                name: accountName,
                account_type_id: accountType.id,
                is_placeholder: false,
                is_active: true,
                balance: 0,
              })
              .select()
              .single();

            gainLossAccount = newAccount;
          }
        }

        if (gainLossAccount) {
          // Insert gain/loss transaction entry
          const gainLossEntrySide = gainLoss > 0 ? "CREDIT" : "DEBIT";

          await supabase.from("transaction_entries").insert({
            transaction_id: saleEntry.transaction_id,
            account_id: gainLossAccount.id,
            entry_side: gainLossEntrySide,
            amount: Math.abs(gainLoss),
            quantity: 1,
            price: Math.abs(gainLoss),
            description: `${gainLoss > 0 ? "Gain" : "Loss"} on sale of ${
              account.name
            } (FIFO)`,
            line_number: 999, // High number to appear last
          });

          // Update the gain/loss account balance
          await this.updateAccountBalances([
            {
              transaction_id: saleEntry.transaction_id,
              account_id: gainLossAccount.id,
              entry_side: gainLossEntrySide,
              amount: Math.abs(gainLoss),
              quantity: 1,
              price: Math.abs(gainLoss),
              description: `${gainLoss > 0 ? "Gain" : "Loss"} on sale of ${
                account.name
              } (FIFO)`,
              line_number: 999,
            },
          ]);
        }
      }

      console.log(`FIFO calculation for ${account.name}:`, {
        saleQuantity,
        saleAmount,
        costBasis,
        gainLoss,
        fifoLots: fifoResult.fifoLots,
      });
    } catch (error) {
      console.error("Error processing FIFO for investment sale:", error);
      // Don't throw error to avoid breaking the transaction
    }
  }
}
