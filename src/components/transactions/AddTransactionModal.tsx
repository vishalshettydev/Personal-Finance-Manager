"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Receipt, Search, X } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Tag } from "@/lib/types";
import { AccountingEngine } from "@/lib/accounting";
import { toast } from "sonner";

interface Account {
  id: string;
  name: string;
  parent_id: string | null;
  is_placeholder: boolean;
  is_active: boolean;
  balance: number;
  account_types: {
    id: string;
    name: string;
    category: string;
  };
}

interface AccountSplitEntry {
  id?: string;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  quantity: number;
  price: number;
  memo: string;
}

interface TransactionFormData {
  description: string;
  reference_number: string;
  transaction_date: string;
  notes: string;
  selected_tags: Tag[];
  account_splits: AccountSplitEntry[];
}

interface AddTransactionModalProps {
  userId: string;
  accounts: Account[];
  tags: Tag[];
  onTransactionAdded: () => void;
  onAccountsRefresh: () => void;
  onTagsRefresh: () => void;
}

export function AddTransactionModal({
  userId,
  accounts,
  tags,
  onTransactionAdded,
  onAccountsRefresh,
  onTagsRefresh,
}: AddTransactionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState<TransactionFormData>({
    description: "",
    reference_number: "",
    transaction_date: new Date().toISOString().split("T")[0],
    notes: "",
    selected_tags: [],
    account_splits: [
      {
        account_id: "",
        debit_amount: 0,
        credit_amount: 0,
        quantity: 1,
        price: 0,
        memo: "",
      },
      {
        account_id: "",
        debit_amount: 0,
        credit_amount: 0,
        quantity: 1,
        price: 0,
        memo: "",
      },
    ],
  });

  // UI states for dropdowns and search
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [accountSearchTerms, setAccountSearchTerms] = useState<{
    [key: number]: string;
  }>({});
  const [showAccountDropdowns, setShowAccountDropdowns] = useState<{
    [key: number]: boolean;
  }>({});

  // Create a new tag instantly
  const createTagInstantly = async (tagName: string): Promise<Tag | null> => {
    const colors = [
      "#EF4444",
      "#F97316",
      "#F59E0B",
      "#EAB308",
      "#84CC16",
      "#22C55E",
      "#10B981",
      "#14B8A6",
      "#06B6D4",
      "#0EA5E9",
      "#3B82F6",
      "#6366F1",
      "#8B5CF6",
      "#A855F7",
      "#D946EF",
      "#EC4899",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({
          user_id: userId,
          name: tagName,
          color: randomColor,
        })
        .select()
        .single();

      if (error) throw error;
      onTagsRefresh();
      return data;
    } catch (error) {
      console.error("Error creating tag:", error);
      return null;
    }
  };

  // Build account path for display
  const getAccountPath = (accountId: string): string => {
    const account = accounts.find((acc) => acc.id === accountId);
    if (!account) return "";

    const buildPath = (acc: Account): string => {
      if (!acc.parent_id) return acc.name;
      const parent = accounts.find((p) => p.id === acc.parent_id);
      return parent ? `${buildPath(parent)}/${acc.name}` : acc.name;
    };

    return buildPath(account);
  };

  // Check if account is investment type (mutual fund or stock)
  const isInvestmentAccount = (account: Account): boolean => {
    return (
      account.account_types.name.toLowerCase() === "mutual fund" ||
      account.account_types.name.toLowerCase() === "stock"
    );
  };

  // Search accounts by name and path
  const searchAccounts = (
    searchTerm: string,
    excludeIds: string[] = []
  ): Account[] => {
    let filteredAccounts = accounts.filter(
      (acc) => !acc.is_placeholder && !excludeIds.includes(acc.id)
    );

    // If there's a search term, filter by name/path
    if (searchTerm) {
      filteredAccounts = filteredAccounts.filter(
        (acc) =>
          acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getAccountPath(acc.id)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    return filteredAccounts.slice(0, 20); // Limit results
  };

  // Account split management
  const addAccountSplit = () => {
    const newIndex = transactionForm.account_splits.length;

    setTransactionForm((prev) => ({
      ...prev,
      account_splits: [
        ...prev.account_splits,
        {
          account_id: "",
          debit_amount: 0,
          credit_amount: 0,
          quantity: 1,
          price: 0,
          memo: "",
        },
      ],
    }));

    // Initialize search term for new entry
    setAccountSearchTerms((prev) => ({
      ...prev,
      [newIndex]: "",
    }));

    setShowAccountDropdowns((prev) => ({
      ...prev,
      [newIndex]: false,
    }));
  };

  const removeAccountSplit = (index: number) => {
    if (transactionForm.account_splits.length <= 2) {
      toast.error("Must have at least two account splits");
      return;
    }

    setTransactionForm((prev) => ({
      ...prev,
      account_splits: prev.account_splits.filter((_, i) => i !== index),
    }));

    // Clean up UI states - rebuild search terms for remaining entries
    const remainingEntries = transactionForm.account_splits.filter(
      (_, i) => i !== index
    );
    const newSearchTerms: { [key: number]: string } = {};
    const newDropdownStates: { [key: number]: boolean } = {};

    remainingEntries.forEach((entry, newIndex) => {
      if (entry.account_id) {
        const account = accounts.find((acc) => acc.id === entry.account_id);
        newSearchTerms[newIndex] = account?.name || "";
      } else {
        newSearchTerms[newIndex] = "";
      }
      newDropdownStates[newIndex] = false;
    });

    setAccountSearchTerms(newSearchTerms);
    setShowAccountDropdowns(newDropdownStates);
  };

  const updateAccountSplit = (
    index: number,
    field: keyof AccountSplitEntry,
    value: string | number
  ) => {
    setTransactionForm((prev) => ({
      ...prev,
      account_splits: prev.account_splits.map((entry, i) => {
        if (i === index) {
          return { ...entry, [field]: value };
        }
        return entry;
      }),
    }));
  };

  const handleAccountSelect = (accountId: string, index: number) => {
    const selectedAccount = accounts.find((acc) => acc.id === accountId);
    updateAccountSplit(index, "account_id", accountId);
    setAccountSearchTerms((prev) => ({
      ...prev,
      [index]: selectedAccount?.name || "",
    }));
    setShowAccountDropdowns((prev) => ({ ...prev, [index]: false }));
  };

  // Calculate totals
  const calculateTotalDebits = (): number => {
    return transactionForm.account_splits.reduce(
      (sum, entry) => sum + (entry.debit_amount || 0),
      0
    );
  };

  const calculateTotalCredits = (): number => {
    return transactionForm.account_splits.reduce(
      (sum, entry) => sum + (entry.credit_amount || 0),
      0
    );
  };

  const calculateDifference = (): number => {
    return calculateTotalDebits() - calculateTotalCredits();
  };

  // Validation for account splits
  const validateAccountSplits = (): boolean => {
    const totalDebits = calculateTotalDebits();
    const totalCredits = calculateTotalCredits();

    // Check if amounts balance
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      toast.error("Total deposits must equal withdrawals");
      return false;
    }

    // Check if all splits have accounts
    if (transactionForm.account_splits.some((entry) => !entry.account_id)) {
      toast.error("All account splits must have an account selected");
      return false;
    }

    // Check if at least one debit and one credit exists
    const hasDebit = transactionForm.account_splits.some(
      (entry) => entry.debit_amount > 0
    );
    const hasCredit = transactionForm.account_splits.some(
      (entry) => entry.credit_amount > 0
    );

    if (!hasDebit || !hasCredit) {
      toast.error("Must have at least one deposit and one withdrawal entry");
      return false;
    }

    // Check for duplicate accounts
    const accountIds = transactionForm.account_splits
      .map((entry) => entry.account_id)
      .filter(Boolean);
    const uniqueAccountIds = new Set(accountIds);
    if (accountIds.length !== uniqueAccountIds.size) {
      toast.error("Cannot use the same account multiple times");
      return false;
    }

    // Validate investment accounts have positive quantity and price if amount > 0
    for (const entry of transactionForm.account_splits) {
      if (
        entry.account_id &&
        (entry.debit_amount > 0 || entry.credit_amount > 0)
      ) {
        const account = accounts.find((acc) => acc.id === entry.account_id);
        if (account && isInvestmentAccount(account)) {
          if (entry.quantity <= 0 || entry.price <= 0) {
            toast.error(
              `Investment account ${account.name} must have positive quantity and price`
            );
            return false;
          }
        }
      }
    }

    return true;
  };

  // Update account price in account_prices table
  const updateAccountPrice = async (
    accountId: string,
    price: number,
    date: string
  ) => {
    try {
      const { data: existingPrice, error: fetchError } = await supabase
        .from("account_prices")
        .select("*")
        .eq("account_id", accountId)
        .eq("user_id", userId)
        .eq("date", date)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (existingPrice) {
        // Update existing price
        const { error: updateError } = await supabase
          .from("account_prices")
          .update({
            price,
            user_id: userId,
          })
          .eq("account_id", accountId)
          .eq("user_id", userId)
          .eq("date", date);

        if (updateError) throw updateError;
      } else {
        // Insert new price
        const { error: insertError } = await supabase
          .from("account_prices")
          .insert({
            user_id: userId,
            account_id: accountId,
            price,
            date: date,
          });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error("Error updating account price:", error);
      toast.error("Warning: Could not update account price");
    }
  };

  // Handle tag selection
  const handleTagSelect = (tag: Tag) => {
    if (!transactionForm.selected_tags.find((t) => t.id === tag.id)) {
      setTransactionForm({
        ...transactionForm,
        selected_tags: [...transactionForm.selected_tags, tag],
      });
    }
    setTagSearchTerm("");
  };

  // Handle tag removal
  const handleTagRemove = (tagId: string) => {
    setTransactionForm({
      ...transactionForm,
      selected_tags: transactionForm.selected_tags.filter(
        (t) => t.id !== tagId
      ),
    });
  };

  // Handle tag creation from search
  const handleTagCreate = async () => {
    if (tagSearchTerm.trim()) {
      const newTag = await createTagInstantly(tagSearchTerm.trim());
      if (newTag) {
        handleTagSelect(newTag);
      }
    }
  };

  // Filter tags based on search term
  const getFilteredTags = () => {
    return tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase()) &&
        !transactionForm.selected_tags.find((t) => t.id === tag.id)
    );
  };

  // Reset form
  const resetForm = () => {
    setTransactionForm({
      description: "",
      reference_number: "",
      transaction_date: new Date().toISOString().split("T")[0],
      notes: "",
      selected_tags: [],
      account_splits: [
        {
          account_id: "",
          debit_amount: 0,
          credit_amount: 0,
          quantity: 1,
          price: 0,
          memo: "",
        },
        {
          account_id: "",
          debit_amount: 0,
          credit_amount: 0,
          quantity: 1,
          price: 0,
          memo: "",
        },
      ],
    });
    setTagSearchTerm("");
    setAccountSearchTerms({ 0: "", 1: "" });
    setShowAccountDropdowns({ 0: false, 1: false });
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      // Validate account splits
      if (!validateAccountSplits()) {
        return;
      }

      const totalAmount = calculateTotalDebits(); // or calculateTotalCredits() - they should be equal

      // Create transaction entries for double-entry
      const entries = transactionForm.account_splits
        .filter(
          (split) =>
            split.account_id &&
            (split.debit_amount > 0 || split.credit_amount > 0)
        )
        .map((split, index) => {
          const isDebit = split.debit_amount > 0;
          const amount = isDebit ? split.debit_amount : split.credit_amount;

          return {
            account_id: split.account_id,
            quantity: split.quantity || 1,
            price: split.price || amount,
            entry_side: isDebit ? ("DEBIT" as const) : ("CREDIT" as const),
            amount: amount,
            line_number: index + 1,
            description: split.memo || transactionForm.description,
          };
        });

      // Validate double-entry
      if (!AccountingEngine.validateTransaction(entries)) {
        toast.error("Invalid transaction: Debits must equal credits");
        return;
      }

      // Insert transaction
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          reference_number: transactionForm.reference_number || null,
          description: transactionForm.description,
          transaction_date: transactionForm.transaction_date,
          total_amount: totalAmount,
          notes: transactionForm.notes || null,
          is_split: true, // All transactions are now splits
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Insert transaction entries
      const entriesWithTransactionId = entries.map((entry) => ({
        ...entry,
        transaction_id: transaction.id,
      }));

      const { error: entriesError } = await supabase
        .from("transaction_entries")
        .insert(entriesWithTransactionId);

      if (entriesError) throw entriesError;

      // Insert transaction tags
      if (transactionForm.selected_tags.length > 0) {
        const tagMappings = transactionForm.selected_tags.map((tag) => ({
          transaction_id: transaction.id,
          tag_id: tag.id,
        }));

        const { error: tagsError } = await supabase
          .from("transaction_tags")
          .insert(tagMappings);

        if (tagsError) throw tagsError;
      }

      // Update account balances
      await AccountingEngine.updateAccountBalances(entriesWithTransactionId);

      // Process FIFO for investment sales
      for (const entry of entriesWithTransactionId) {
        if (entry.entry_side === "CREDIT") {
          const account = accounts.find((acc) => acc.id === entry.account_id);
          if (account && isInvestmentAccount(account)) {
            await AccountingEngine.processInvestmentSaleWithFIFO(
              entry,
              transactionForm.transaction_date,
              userId
            );
          }
        }
      }

      // Update account prices for investment accounts
      for (const split of transactionForm.account_splits) {
        if (
          split.account_id &&
          split.price > 0 &&
          (split.debit_amount > 0 || split.credit_amount > 0)
        ) {
          const account = accounts.find((acc) => acc.id === split.account_id);
          if (account && isInvestmentAccount(account)) {
            await updateAccountPrice(
              split.account_id,
              split.price,
              transactionForm.transaction_date
            );
          }
        }
      }

      // Reset form and refresh data
      resetForm();
      onTransactionAdded();
      onAccountsRefresh();
      setIsOpen(false);

      toast.success("Transaction added successfully!");
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error("Error creating transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          <span>Add Transaction</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-600" />
            Add Transaction
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleTransactionSubmit} className="space-y-6">
          {/* Basic Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description *
              </Label>
              <Input
                id="description"
                value={transactionForm.description}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    description: e.target.value,
                  })
                }
                placeholder="Transaction description"
                className="h-9"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction_date" className="text-sm font-medium">
                Date *
              </Label>
              <Input
                id="transaction_date"
                type="date"
                value={transactionForm.transaction_date}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    transaction_date: e.target.value,
                  })
                }
                className="h-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference_number" className="text-sm font-medium">
              Reference Number
            </Label>
            <Input
              id="reference_number"
              value={transactionForm.reference_number}
              onChange={(e) =>
                setTransactionForm({
                  ...transactionForm,
                  reference_number: e.target.value,
                })
              }
              placeholder="Reference number"
              className="h-9"
            />
          </div>

          {/* Account Splits */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Account Splits</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAccountSplit}
                className="h-8 text-green-600 border-green-600 hover:bg-green-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Split
              </Button>
            </div>

            <div className="border rounded-lg overflow-visible">
              {/* Table Header */}
              <div className="bg-gray-50 border-b grid grid-cols-12 gap-2 p-3 text-sm font-medium text-gray-700">
                <div className="col-span-3">Account</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2">Deposit</div>
                <div className="col-span-2">Withdraw</div>
                <div className="col-span-1">Action</div>
              </div>

              {/* Account Split Rows */}
              <div className="divide-y overflow-visible">
                {transactionForm.account_splits.map((split, index) => {
                  const account = accounts.find(
                    (acc) => acc.id === split.account_id
                  );
                  const isInvestment = account && isInvestmentAccount(account);

                  return (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 p-3 items-start overflow-visible"
                    >
                      {/* Account Selection */}
                      <div className="col-span-3 space-y-1 relative overflow-visible">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            value={accountSearchTerms[index] || ""}
                            onChange={(e) => {
                              setAccountSearchTerms((prev) => ({
                                ...prev,
                                [index]: e.target.value,
                              }));
                              setShowAccountDropdowns((prev) => ({
                                ...prev,
                                [index]: e.target.value.length > 0,
                              }));
                            }}
                            onFocus={() =>
                              setShowAccountDropdowns((prev) => ({
                                ...prev,
                                [index]: true,
                              }))
                            }
                            onBlur={() => {
                              setTimeout(() => {
                                setShowAccountDropdowns((prev) => ({
                                  ...prev,
                                  [index]: false,
                                }));
                              }, 200);
                            }}
                            placeholder="Select Account"
                            className="pl-10 h-9 text-sm"
                          />
                        </div>
                        {split.account_id && (
                          <div className="text-xs text-gray-500">
                            {getAccountPath(split.account_id)}
                          </div>
                        )}
                        {showAccountDropdowns[index] && (
                          <div className="absolute top-full left-0 right-0 z-[9999] bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto mt-1">
                            {searchAccounts(
                              accountSearchTerms[index] || "",
                              transactionForm.account_splits
                                .map((s) => s.account_id)
                                .filter(Boolean)
                            ).map((account) => (
                              <button
                                key={account.id}
                                type="button"
                                onClick={() =>
                                  handleAccountSelect(account.id, index)
                                }
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 hover:border-l-4 hover:border-l-blue-500 border-b border-gray-100 last:border-b-0 transition-all duration-150 focus:bg-blue-50 focus:outline-none"
                              >
                                <div className="font-semibold text-sm text-gray-900">
                                  {account.name}
                                </div>
                                <div className="text-xs text-gray-600 mt-0.5">
                                  {getAccountPath(account.id)}
                                </div>
                              </button>
                            ))}
                            {searchAccounts(
                              accountSearchTerms[index] || "",
                              transactionForm.account_splits
                                .map((s) => s.account_id)
                                .filter(Boolean)
                            ).length === 0 && (
                              <div className="text-center text-gray-500 py-4 text-sm font-medium">
                                No accounts found
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quantity (for investment accounts) */}
                      <div className="col-span-2">
                        <Input
                          value={isInvestment ? split.quantity || "" : ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty string or valid numbers
                            if (
                              value === "" ||
                              (!isNaN(Number(value)) && Number(value) >= 0)
                            ) {
                              updateAccountSplit(
                                index,
                                "quantity",
                                value === "" ? 0 : parseFloat(value)
                              );
                            }
                          }}
                          placeholder={isInvestment ? "1.00000000" : "N/A"}
                          className="h-9 text-sm"
                          disabled={!isInvestment}
                        />
                      </div>

                      {/* Price (for investment accounts) */}
                      <div className="col-span-2">
                        <Input
                          value={isInvestment ? split.price || "" : ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty string or valid numbers
                            if (
                              value === "" ||
                              (!isNaN(Number(value)) && Number(value) >= 0)
                            ) {
                              updateAccountSplit(
                                index,
                                "price",
                                value === "" ? 0 : parseFloat(value)
                              );
                            }
                          }}
                          placeholder={isInvestment ? "0.00000000" : "N/A"}
                          className="h-9 text-sm"
                          disabled={!isInvestment}
                        />
                      </div>

                      {/* Debit Amount */}
                      <div className="col-span-2">
                        <Input
                          value={split.debit_amount || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty string or valid numbers
                            if (
                              value === "" ||
                              (!isNaN(Number(value)) && Number(value) >= 0)
                            ) {
                              const numValue =
                                value === "" ? 0 : parseFloat(value);
                              updateAccountSplit(
                                index,
                                "debit_amount",
                                numValue
                              );
                              // Clear credit amount when debit is entered
                              if (numValue > 0) {
                                updateAccountSplit(index, "credit_amount", 0);
                              }
                            }
                          }}
                          placeholder="0.00"
                          className="h-9 text-sm"
                        />
                      </div>

                      {/* Credit Amount */}
                      <div className="col-span-2">
                        <Input
                          value={split.credit_amount || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty string or valid numbers
                            if (
                              value === "" ||
                              (!isNaN(Number(value)) && Number(value) >= 0)
                            ) {
                              const numValue =
                                value === "" ? 0 : parseFloat(value);
                              updateAccountSplit(
                                index,
                                "credit_amount",
                                numValue
                              );
                              // Clear debit amount when credit is entered
                              if (numValue > 0) {
                                updateAccountSplit(index, "debit_amount", 0);
                              }
                            }
                          }}
                          placeholder="0.00"
                          className="h-9 text-sm"
                        />
                      </div>

                      {/* Remove Button */}
                      <div className="col-span-1 flex justify-center">
                        {transactionForm.account_splits.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeAccountSplit(index)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="bg-blue-50 border-t p-4">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-8">
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        Total Deposits
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        ₹{calculateTotalDebits().toFixed(2)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        Total Withdrawals
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        ₹{calculateTotalCredits().toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Difference
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        Math.abs(calculateDifference()) < 0.01
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {calculateDifference() >= 0 ? "+" : ""}₹
                      {calculateDifference().toFixed(2)}
                    </div>
                    {Math.abs(calculateDifference()) >= 0.01 && (
                      <div className="text-xs text-red-600 mt-1">
                        Must be balanced
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2 relative">
            <Label htmlFor="tags" className="text-sm font-medium">
              Tags
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="tags"
                value={tagSearchTerm}
                onChange={(e) => setTagSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const filteredTags = getFilteredTags();
                    if (filteredTags.length > 0) {
                      handleTagSelect(filteredTags[0]);
                    } else if (tagSearchTerm.trim()) {
                      handleTagCreate();
                    }
                  }
                }}
                placeholder="Search tags..."
                className="pl-10 h-9"
              />
            </div>
            {tagSearchTerm && (
              <div className="absolute z-10 bg-white border rounded-md shadow-lg max-h-32 overflow-y-auto mt-1 w-full">
                {getFilteredTags().map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagSelect(tag)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0 text-sm"
                  >
                    {tag.name}
                  </button>
                ))}
                {getFilteredTags().length === 0 && tagSearchTerm.trim() && (
                  <button
                    type="button"
                    onClick={handleTagCreate}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 bg-blue-50 text-blue-600 text-sm"
                  >
                    Create &quot;{tagSearchTerm}&quot;
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Selected Tags */}
          {transactionForm.selected_tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {transactionForm.selected_tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                >
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => handleTagRemove(tag.id)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={transactionForm.notes}
              onChange={(e) =>
                setTransactionForm({
                  ...transactionForm,
                  notes: e.target.value,
                })
              }
              placeholder="Additional notes..."
              className="min-h-[80px] resize-none text-sm"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !transactionForm.description ||
                transactionForm.account_splits.some(
                  (split) => !split.account_id
                ) ||
                Math.abs(calculateDifference()) >= 0.01 ||
                calculateTotalDebits() === 0 ||
                calculateTotalCredits() === 0
              }
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </div>
              ) : (
                "Add Transaction"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
