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
import {
  Plus,
  Receipt,
  Search,
  X,
  TrendingUp,
  ArrowRightLeft,
  Split,
  Trash2,
} from "lucide-react";

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

interface SplitToEntry {
  id?: string;
  account_id: string;
  amount: number;
  description: string;
}

interface TransactionFormData {
  description: string;
  reference_number: string;
  transaction_date: string;
  transaction_type: "investment" | "regular";
  investment_type: "buy" | "sell";
  quantity: string;
  price: string;
  amount: string;
  notes: string;
  debit_account_id: string;
  credit_account_id: string;
  selected_tags: Tag[];
  is_split: boolean;
  split_to_entries: SplitToEntry[];
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
    transaction_type: "regular",
    investment_type: "buy",
    quantity: "1",
    price: "",
    amount: "",
    notes: "",
    debit_account_id: "",
    credit_account_id: "",
    selected_tags: [],
    is_split: false,
    split_to_entries: [
      {
        account_id: "",
        amount: 0,
        description: "",
      },
    ],
  });

  // UI states for dropdowns and search
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [fromAccountSearch, setFromAccountSearch] = useState("");
  const [toAccountSearch, setToAccountSearch] = useState("");
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [splitAccountSearchTerms, setSplitAccountSearchTerms] = useState<{
    [key: number]: string;
  }>({});
  const [showSplitDropdowns, setShowSplitDropdowns] = useState<{
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

  // Search accounts by name and path with investment filtering
  const searchAccounts = (
    searchTerm: string,
    excludeIds: string[] = [],
    isFromAccount: boolean = false
  ): Account[] => {
    if (!searchTerm) return [];

    let filteredAccounts = accounts.filter(
      (acc) =>
        !acc.is_placeholder &&
        !excludeIds.includes(acc.id) &&
        (acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getAccountPath(acc.id)
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))
    );

    // Apply transaction type filtering
    if (transactionForm.transaction_type === "investment") {
      if (isFromAccount) {
        if (transactionForm.investment_type === "buy") {
          // For buy: exclude investment accounts from "from" account
          filteredAccounts = filteredAccounts.filter(
            (acc) => !isInvestmentAccount(acc)
          );
        } else {
          // For sell: only show investment accounts in "from" account
          filteredAccounts = filteredAccounts.filter((acc) =>
            isInvestmentAccount(acc)
          );
        }
      } else {
        // To account
        if (transactionForm.investment_type === "buy") {
          // For buy: only show investment accounts in "to" account
          filteredAccounts = filteredAccounts.filter((acc) =>
            isInvestmentAccount(acc)
          );
        } else {
          // For sell: exclude investment accounts from "to" account
          filteredAccounts = filteredAccounts.filter(
            (acc) => !isInvestmentAccount(acc)
          );
        }
      }
    }

    return filteredAccounts.slice(0, 20); // Limit results
  };

  // Split transaction management
  const toggleSplitTransaction = () => {
    setTransactionForm((prev) => ({
      ...prev,
      is_split: !prev.is_split,
      credit_account_id: prev.is_split ? prev.credit_account_id : "", // Clear regular to account when enabling split
      split_to_entries: prev.is_split
        ? [{ account_id: "", amount: 0, description: "" }]
        : prev.split_to_entries,
    }));

    // Clear/Initialize split-related UI states
    if (transactionForm.is_split) {
      // Disabling split - clear everything
      setSplitAccountSearchTerms({});
      setShowSplitDropdowns({});
    } else {
      // Enabling split - initialize first entry
      setSplitAccountSearchTerms({ 0: "" });
      setShowSplitDropdowns({ 0: false });
    }

    setToAccountSearch("");
    setShowToDropdown(false);
  };

  const addSplitToEntry = () => {
    const newIndex = transactionForm.split_to_entries.length;

    setTransactionForm((prev) => ({
      ...prev,
      split_to_entries: [
        ...prev.split_to_entries,
        { account_id: "", amount: 0, description: "" },
      ],
    }));

    // Initialize search term for new entry
    setSplitAccountSearchTerms((prev) => ({
      ...prev,
      [newIndex]: "",
    }));

    setShowSplitDropdowns((prev) => ({
      ...prev,
      [newIndex]: false,
    }));
  };

  const removeSplitToEntry = (index: number) => {
    if (transactionForm.split_to_entries.length <= 1) {
      toast.error("Must have at least one split entry");
      return;
    }

    setTransactionForm((prev) => ({
      ...prev,
      split_to_entries: prev.split_to_entries.filter((_, i) => i !== index),
    }));

    // Clean up UI states - rebuild search terms for remaining entries
    const remainingEntries = transactionForm.split_to_entries.filter(
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

    setSplitAccountSearchTerms(newSearchTerms);
    setShowSplitDropdowns(newDropdownStates);
  };

  const updateSplitToEntry = (
    index: number,
    field: keyof SplitToEntry,
    value: string | number
  ) => {
    setTransactionForm((prev) => ({
      ...prev,
      split_to_entries: prev.split_to_entries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const handleSplitAccountSelect = (accountId: string, index: number) => {
    const selectedAccount = accounts.find((acc) => acc.id === accountId);
    updateSplitToEntry(index, "account_id", accountId);
    setSplitAccountSearchTerms((prev) => ({
      ...prev,
      [index]: selectedAccount?.name || "",
    }));
    setShowSplitDropdowns((prev) => ({ ...prev, [index]: false }));
  };

  // Calculate split amounts and validation
  const calculateSplitTotal = (): number => {
    return transactionForm.split_to_entries.reduce(
      (sum, entry) => sum + entry.amount,
      0
    );
  };

  const calculateRemainingAmount = (): number => {
    const totalAmount = parseFloat(transactionForm.amount) || 0;
    const splitTotal = calculateSplitTotal();
    return Math.max(0, totalAmount - splitTotal);
  };

  // Validation for split transactions
  const validateSplitTransaction = (): boolean => {
    if (!transactionForm.is_split) return true;

    const totalAmount = parseFloat(transactionForm.amount) || 0;
    const splitTotal = calculateSplitTotal();

    // Check if amounts balance
    if (Math.abs(totalAmount - splitTotal) > 0.01) {
      toast.error("Split amounts must equal the total amount");
      return false;
    }

    // Check if all split entries have accounts
    if (transactionForm.split_to_entries.some((entry) => !entry.account_id)) {
      toast.error("All split entries must have an account selected");
      return false;
    }

    // Check if all amounts are positive
    if (transactionForm.split_to_entries.some((entry) => entry.amount <= 0)) {
      toast.error("All split amounts must be greater than zero");
      return false;
    }

    // Check for duplicate accounts
    const accountIds = transactionForm.split_to_entries.map(
      (entry) => entry.account_id
    );
    const uniqueAccountIds = new Set(accountIds);
    if (accountIds.length !== uniqueAccountIds.size) {
      toast.error("Cannot use the same account multiple times");
      return false;
    }

    return true;
  };

  // Update account price in account_prices table
  const updateAccountPrice = async (accountId: string, price: number) => {
    try {
      const { data: existingPrice, error: fetchError } = await supabase
        .from("account_prices")
        .select("*")
        .eq("account_id", accountId)
        .eq("date", transactionForm.transaction_date)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 is "no rows returned" which is expected when no price exists
        throw fetchError;
      }

      if (existingPrice) {
        // Update existing price
        const { error: updateError } = await supabase
          .from("account_prices")
          .update({ price })
          .eq("account_id", accountId)
          .eq("date", transactionForm.transaction_date);

        if (updateError) throw updateError;
      } else {
        // Insert new price
        const { error: insertError } = await supabase
          .from("account_prices")
          .insert({
            account_id: accountId,
            price,
            date: transactionForm.transaction_date,
          });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error("Error updating account price:", error);
      // Don't throw here to avoid blocking the main transaction
      toast.error("Warning: Could not update account price");
    }
  };

  // Calculate amount for investment transactions
  const calculateAmount = (newQuantity?: string, newPrice?: string) => {
    if (transactionForm.transaction_type === "investment") {
      const quantity = parseFloat(newQuantity ?? transactionForm.quantity) || 0;
      const price = parseFloat(newPrice ?? transactionForm.price) || 0;
      const amount = quantity * price;
      setTransactionForm((prev) => ({ ...prev, amount: amount.toString() }));
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
      transaction_type: "regular",
      investment_type: "buy",
      quantity: "1",
      price: "",
      amount: "",
      notes: "",
      debit_account_id: "",
      credit_account_id: "",
      selected_tags: [],
      is_split: false,
      split_to_entries: [
        {
          account_id: "",
          amount: 0,
          description: "",
        },
      ],
    });
    setTagSearchTerm("");
    setFromAccountSearch("");
    setToAccountSearch("");
    setShowFromDropdown(false);
    setShowToDropdown(false);
    setSplitAccountSearchTerms({ 0: "" }); // Initialize first entry
    setShowSplitDropdowns({ 0: false });
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const amount = parseFloat(transactionForm.amount);
      if (amount <= 0) {
        toast.error("Amount must be greater than 0");
        return;
      }

      // Validate split transaction if enabled
      if (transactionForm.is_split && !validateSplitTransaction()) {
        return;
      }

      // For investments, validate quantity and price
      if (transactionForm.transaction_type === "investment") {
        const quantity = parseFloat(transactionForm.quantity);
        const price = parseFloat(transactionForm.price);
        if (quantity <= 0 || price <= 0) {
          toast.error(
            "Quantity and price must be greater than 0 for investments"
          );
          return;
        }
      }

      const quantity =
        transactionForm.transaction_type === "investment"
          ? parseFloat(transactionForm.quantity)
          : 1;
      const price =
        transactionForm.transaction_type === "investment"
          ? parseFloat(transactionForm.price)
          : amount;

      // Create transaction entries for double-entry
      let entries;

      if (transactionForm.is_split) {
        // Split transaction: one debit, multiple credits
        entries = [
          // Single from account (DEBIT)
          {
            account_id: transactionForm.debit_account_id,
            quantity: 1,
            price: amount,
            entry_side: "DEBIT" as const,
            amount: amount,
            line_number: 1,
            description: transactionForm.description,
          },
          // Multiple to accounts (CREDITS)
          ...transactionForm.split_to_entries.map((splitEntry, index) => ({
            account_id: splitEntry.account_id,
            quantity: 1,
            price: splitEntry.amount,
            entry_side: "CREDIT" as const,
            amount: splitEntry.amount,
            line_number: index + 2,
            description: splitEntry.description || transactionForm.description,
          })),
        ];
      } else {
        // Regular transaction: one debit, one credit
        entries = [
          {
            account_id: transactionForm.debit_account_id, // From Account
            quantity: transactionForm.transaction_type === "investment" ? 1 : 1,
            price: amount,
            entry_side: "DEBIT" as const,
            amount: amount,
            line_number: 1,
            description: transactionForm.description,
          },
          {
            account_id: transactionForm.credit_account_id, // To Account
            quantity:
              transactionForm.transaction_type === "investment" ? quantity : 1,
            price:
              transactionForm.transaction_type === "investment"
                ? price
                : amount,
            entry_side: "CREDIT" as const,
            amount: amount,
            line_number: 2,
            description: transactionForm.description,
          },
        ];
      }

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
          total_amount: amount,
          notes: transactionForm.notes || null,
          is_split: transactionForm.is_split,
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

      // Update account price for investment transactions
      if (transactionForm.transaction_type === "investment") {
        const priceValue = parseFloat(transactionForm.price);
        if (transactionForm.investment_type === "buy") {
          // For buy transactions, update price for the "to" account (investment account)
          if (transactionForm.is_split) {
            // For split investment transactions, find the investment account in splits
            const investmentSplit = transactionForm.split_to_entries.find(
              (entry) => {
                const account = accounts.find(
                  (acc) => acc.id === entry.account_id
                );
                return account && isInvestmentAccount(account);
              }
            );
            if (investmentSplit) {
              await updateAccountPrice(investmentSplit.account_id, priceValue);
            }
          } else {
            await updateAccountPrice(
              transactionForm.credit_account_id,
              priceValue
            );
          }
        } else {
          // For sell transactions, update price for the "from" account (investment account)
          await updateAccountPrice(
            transactionForm.debit_account_id,
            priceValue
          );
        }
      }

      // Reset form and refresh data
      resetForm();
      onTransactionAdded();
      onAccountsRefresh();
      setIsOpen(false);

      const transactionTypeText = transactionForm.is_split
        ? "Split transaction"
        : "Transaction";
      toast.success(`${transactionTypeText} added successfully!`);
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-600" />
            Add Transaction
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleTransactionSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={
                transactionForm.transaction_type === "regular"
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => {
                setTransactionForm({
                  ...transactionForm,
                  transaction_type: "regular",
                  debit_account_id: "",
                  credit_account_id: "",
                });
                setFromAccountSearch("");
                setToAccountSearch("");
                setShowFromDropdown(false);
                setShowToDropdown(false);
              }}
              className="flex-1 h-8"
            >
              <ArrowRightLeft className="w-3 h-3 mr-1" />
              Regular
            </Button>
            <Button
              type="button"
              variant={
                transactionForm.transaction_type === "investment"
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => {
                setTransactionForm({
                  ...transactionForm,
                  transaction_type: "investment",
                  debit_account_id: "",
                  credit_account_id: "",
                });
                setFromAccountSearch("");
                setToAccountSearch("");
                setShowFromDropdown(false);
                setShowToDropdown(false);
              }}
              className="flex-1 h-8"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Investment
            </Button>
          </div>

          {/* Investment Type (Buy/Sell) - Only show when Investment is selected */}
          {transactionForm.transaction_type === "investment" && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant={
                  transactionForm.investment_type === "buy"
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => {
                  setTransactionForm({
                    ...transactionForm,
                    investment_type: "buy",
                    debit_account_id: "",
                    credit_account_id: "",
                  });
                  setFromAccountSearch("");
                  setToAccountSearch("");
                  setShowFromDropdown(false);
                  setShowToDropdown(false);
                }}
                className="flex-1 h-8"
              >
                Buy
              </Button>
              <Button
                type="button"
                variant={
                  transactionForm.investment_type === "sell"
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => {
                  setTransactionForm({
                    ...transactionForm,
                    investment_type: "sell",
                    debit_account_id: "",
                    credit_account_id: "",
                  });
                  setFromAccountSearch("");
                  setToAccountSearch("");
                  setShowFromDropdown(false);
                  setShowToDropdown(false);
                }}
                className="flex-1 h-8"
              >
                Sell
              </Button>
            </div>
          )}

          {/* Basic Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="description" className="text-sm">
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
            <div className="space-y-1">
              <Label htmlFor="transaction_date" className="text-sm">
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

          {/* Investment Fields */}
          {transactionForm.transaction_type === "investment" ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="quantity" className="text-sm">
                  Quantity *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.00000001"
                  min="0.00000001"
                  value={transactionForm.quantity}
                  onChange={(e) => {
                    const newQuantity = e.target.value;
                    setTransactionForm({
                      ...transactionForm,
                      quantity: newQuantity,
                    });
                    calculateAmount(newQuantity, transactionForm.price);
                  }}
                  placeholder="1.00000000"
                  className="h-9"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="price" className="text-sm">
                  Price (₹) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.00000001"
                  min="0.00000001"
                  value={transactionForm.price}
                  onChange={(e) => {
                    const newPrice = e.target.value;
                    setTransactionForm({
                      ...transactionForm,
                      price: newPrice,
                    });
                    calculateAmount(transactionForm.quantity, newPrice);
                  }}
                  placeholder="0.00000000"
                  className="h-9"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="amount" className="text-sm">
                  Amount (₹)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.000001"
                  value={transactionForm.amount}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      amount: e.target.value,
                    })
                  }
                  placeholder="0.000000"
                  className="h-9 bg-gray-50"
                  readOnly
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="amount" className="text-sm">
                Amount (₹) *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.000001"
                min="0.000001"
                value={transactionForm.amount}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    amount: e.target.value,
                  })
                }
                placeholder="0.000000"
                className="h-9"
                required
              />
            </div>
          )}

          {/* Split Transaction Toggle */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="split-toggle"
              checked={transactionForm.is_split}
              onChange={toggleSplitTransaction}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="split-toggle"
              className="flex items-center gap-2 text-sm font-medium cursor-pointer"
            >
              <Split className="w-4 h-4" />
              Split Transaction
            </label>
            {transactionForm.is_split && (
              <span className="text-xs text-gray-600 ml-auto">
                Split to multiple accounts
              </span>
            )}
          </div>

          {/* Account Selection */}
          <div className="space-y-4">
            {/* From Account */}
            <div className="space-y-1 relative">
              <Label className="text-sm">From Account *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  value={fromAccountSearch}
                  onChange={(e) => {
                    setFromAccountSearch(e.target.value);
                    setShowFromDropdown(e.target.value.length > 0);
                  }}
                  onFocus={() =>
                    setShowFromDropdown(fromAccountSearch.length > 0)
                  }
                  placeholder="Search accounts..."
                  className="pl-9 h-9"
                />
              </div>
              {transactionForm.debit_account_id && (
                <div className="text-xs text-gray-600 mt-1">
                  {getAccountPath(transactionForm.debit_account_id)}
                </div>
              )}
              {showFromDropdown && (
                <div className="absolute top-full left-0 right-0 z-10 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {searchAccounts(fromAccountSearch, undefined, true).map(
                    (account) => (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => {
                          setTransactionForm({
                            ...transactionForm,
                            debit_account_id: account.id,
                            credit_account_id: "",
                          });
                          setFromAccountSearch(account.name);
                          setShowFromDropdown(false);
                          setToAccountSearch("");
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="font-medium text-sm">
                          {account.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getAccountPath(account.id)}
                        </div>
                      </button>
                    )
                  )}
                  {searchAccounts(fromAccountSearch, undefined, true).length ===
                    0 && (
                    <div className="text-center text-gray-500 py-3 text-sm">
                      No accounts found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* To Account(s) */}
            {!transactionForm.is_split ? (
              /* Regular To Account */
              <div className="space-y-1 relative">
                <Label className="text-sm">To Account *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input
                    value={toAccountSearch}
                    onChange={(e) => {
                      setToAccountSearch(e.target.value);
                      setShowToDropdown(e.target.value.length > 0);
                    }}
                    onFocus={() =>
                      setShowToDropdown(toAccountSearch.length > 0)
                    }
                    placeholder="Search accounts..."
                    className="pl-9 h-9"
                    disabled={!transactionForm.debit_account_id}
                  />
                </div>
                {transactionForm.credit_account_id && (
                  <div className="text-xs text-gray-600 mt-1">
                    {getAccountPath(transactionForm.credit_account_id)}
                  </div>
                )}
                {showToDropdown && transactionForm.debit_account_id && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {searchAccounts(
                      toAccountSearch,
                      [transactionForm.debit_account_id],
                      false
                    ).map((account) => (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => {
                          setTransactionForm({
                            ...transactionForm,
                            credit_account_id: account.id,
                          });
                          setToAccountSearch(account.name);
                          setShowToDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="font-medium text-sm">
                          {account.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getAccountPath(account.id)}
                        </div>
                      </button>
                    ))}
                    {searchAccounts(
                      toAccountSearch,
                      [transactionForm.debit_account_id],
                      false
                    ).length === 0 && (
                      <div className="text-center text-gray-500 py-3 text-sm">
                        No accounts found
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Split To Accounts */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    To Accounts (Split) *
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSplitToEntry}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Account
                  </Button>
                </div>

                <div className="space-y-4">
                  {transactionForm.split_to_entries.map((entry, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          Split Entry {index + 1}
                        </span>
                        {transactionForm.split_to_entries.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeSplitToEntry(index)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Account Selection */}
                        <div className="space-y-2 relative">
                          <Label className="text-sm">Account *</Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              value={splitAccountSearchTerms[index] || ""}
                              onChange={(e) => {
                                setSplitAccountSearchTerms((prev) => ({
                                  ...prev,
                                  [index]: e.target.value,
                                }));
                                setShowSplitDropdowns((prev) => ({
                                  ...prev,
                                  [index]: e.target.value.length > 0,
                                }));
                              }}
                              onFocus={() =>
                                setShowSplitDropdowns((prev) => ({
                                  ...prev,
                                  [index]: true,
                                }))
                              }
                              onBlur={() => {
                                // Delay hiding dropdown to allow selection
                                setTimeout(() => {
                                  setShowSplitDropdowns((prev) => ({
                                    ...prev,
                                    [index]: false,
                                  }));
                                }, 200);
                              }}
                              placeholder="Search accounts..."
                              className="pl-10 h-10"
                            />
                          </div>
                          {entry.account_id && (
                            <div className="text-xs text-gray-500 mt-1">
                              Selected:{" "}
                              {
                                accounts.find(
                                  (acc) => acc.id === entry.account_id
                                )?.name
                              }
                            </div>
                          )}
                          {showSplitDropdowns[index] && (
                            <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                              {searchAccounts(
                                splitAccountSearchTerms[index] || "",
                                [
                                  transactionForm.debit_account_id,
                                  ...transactionForm.split_to_entries.map(
                                    (e) => e.account_id
                                  ),
                                ].filter(Boolean),
                                false
                              ).map((account) => (
                                <button
                                  key={account.id}
                                  type="button"
                                  onClick={() =>
                                    handleSplitAccountSelect(account.id, index)
                                  }
                                  className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
                                >
                                  <div className="font-medium text-sm">
                                    {account.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {getAccountPath(account.id)}
                                  </div>
                                </button>
                              ))}
                              {searchAccounts(
                                splitAccountSearchTerms[index] || "",
                                [
                                  transactionForm.debit_account_id,
                                  ...transactionForm.split_to_entries.map(
                                    (e) => e.account_id
                                  ),
                                ].filter(Boolean),
                                false
                              ).length === 0 && (
                                <div className="text-center text-gray-500 py-3 text-sm">
                                  No accounts found
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                          <Label className="text-sm">Amount (₹) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={entry.amount || ""}
                            onChange={(e) =>
                              updateSplitToEntry(
                                index,
                                "amount",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                            className="h-10"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Split Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Amount:</span>
                      <span className="font-bold text-blue-900">
                        ₹{transactionForm.amount || "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Split Total:</span>
                      <span className="font-bold text-blue-900">
                        ₹{calculateSplitTotal().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Difference:</span>
                      <span
                        className={`font-bold ${
                          calculateRemainingAmount() === 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        ₹{calculateRemainingAmount().toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {calculateRemainingAmount() !== 0 && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                      ⚠️ Split amounts must equal the total amount before
                      submitting
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="reference_number" className="text-sm">
                Reference
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
            <div className="space-y-1 relative">
              <Label htmlFor="tags" className="text-sm">
                Tags
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
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
                  className="pl-9 h-9"
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
          </div>

          {/* Selected Tags */}
          {transactionForm.selected_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {transactionForm.selected_tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                >
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => handleTagRemove(tag.id)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="notes" className="text-sm">
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
              className="min-h-[60px] resize-none text-sm"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !transactionForm.description ||
                !transactionForm.amount ||
                !transactionForm.debit_account_id ||
                (transactionForm.is_split
                  ? transactionForm.split_to_entries.some(
                      (entry) => !entry.account_id || entry.amount <= 0
                    ) ||
                    Math.abs(
                      parseFloat(transactionForm.amount) - calculateSplitTotal()
                    ) > 0.01
                  : !transactionForm.credit_account_id) ||
                (transactionForm.transaction_type === "investment" &&
                  (!transactionForm.quantity || !transactionForm.price))
              }
              size="sm"
              className="min-w-[80px]"
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
