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
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
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

interface TransactionFormData {
  description: string;
  reference_number: string;
  transaction_date: string;
  transaction_type: "investment" | "regular";
  quantity: string;
  price: string;
  amount: string;
  notes: string;
  debit_account_id: string;
  credit_account_id: string;
  selected_tags: Tag[];
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
    quantity: "1",
    price: "",
    amount: "",
    notes: "",
    debit_account_id: "",
    credit_account_id: "",
    selected_tags: [],
  });

  // UI states for dropdowns and search
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [fromAccountSearch, setFromAccountSearch] = useState("");
  const [toAccountSearch, setToAccountSearch] = useState("");
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

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

  // Search accounts by name and path
  const searchAccounts = (
    searchTerm: string,
    excludeId?: string
  ): Account[] => {
    if (!searchTerm) return [];

    return accounts
      .filter(
        (acc) =>
          !acc.is_placeholder &&
          acc.id !== excludeId &&
          (acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getAccountPath(acc.id)
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      )
      .slice(0, 10); // Limit to 10 results
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
      quantity: "1",
      price: "",
      amount: "",
      notes: "",
      debit_account_id: "",
      credit_account_id: "",
      selected_tags: [],
    });
    setTagSearchTerm("");
    setFromAccountSearch("");
    setToAccountSearch("");
    setShowFromDropdown(false);
    setShowToDropdown(false);
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
      // From Account = DEBIT (money going out)
      // To Account = CREDIT (money coming in)
      const entries = [
        {
          account_id: transactionForm.debit_account_id, // From Account
          quantity: transactionForm.transaction_type === "investment" ? 1 : 1,
          price: amount,
          entry_type: "DEBIT" as "BUY" | "SELL" | "DEBIT" | "CREDIT",
          amount: amount,
          description: transactionForm.description,
        },
        {
          account_id: transactionForm.credit_account_id, // To Account
          quantity:
            transactionForm.transaction_type === "investment" ? quantity : 1,
          price:
            transactionForm.transaction_type === "investment" ? price : amount,
          entry_type: "CREDIT" as "BUY" | "SELL" | "DEBIT" | "CREDIT",
          amount: amount,
          description: transactionForm.description,
        },
      ];

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
              onClick={() =>
                setTransactionForm({
                  ...transactionForm,
                  transaction_type: "regular",
                })
              }
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
              onClick={() =>
                setTransactionForm({
                  ...transactionForm,
                  transaction_type: "investment",
                })
              }
              className="flex-1 h-8"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Investment
            </Button>
          </div>

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
                  step="0.001"
                  min="0.001"
                  value={transactionForm.quantity}
                  onChange={(e) => {
                    const newQuantity = e.target.value;
                    setTransactionForm({
                      ...transactionForm,
                      quantity: newQuantity,
                    });
                    calculateAmount(newQuantity, transactionForm.price);
                  }}
                  placeholder="1"
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
                  step="0.01"
                  min="0.01"
                  value={transactionForm.price}
                  onChange={(e) => {
                    const newPrice = e.target.value;
                    setTransactionForm({
                      ...transactionForm,
                      price: newPrice,
                    });
                    calculateAmount(transactionForm.quantity, newPrice);
                  }}
                  placeholder="0.00"
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
                  step="0.01"
                  value={transactionForm.amount}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      amount: e.target.value,
                    })
                  }
                  placeholder="0.00"
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
                step="0.01"
                min="0.01"
                value={transactionForm.amount}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    amount: e.target.value,
                  })
                }
                placeholder="0.00"
                className="h-9"
                required
              />
            </div>
          )}

          {/* Account Selection */}
          <div className="grid grid-cols-2 gap-3">
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
                  {searchAccounts(fromAccountSearch).map((account) => (
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
                      <div className="font-medium text-sm">{account.name}</div>
                      <div className="text-xs text-gray-500">
                        {getAccountPath(account.id)}
                      </div>
                    </button>
                  ))}
                  {searchAccounts(fromAccountSearch).length === 0 && (
                    <div className="text-center text-gray-500 py-3 text-sm">
                      No accounts found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* To Account */}
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
                  onFocus={() => setShowToDropdown(toAccountSearch.length > 0)}
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
                    transactionForm.debit_account_id
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
                      <div className="font-medium text-sm">{account.name}</div>
                      <div className="text-xs text-gray-500">
                        {getAccountPath(account.id)}
                      </div>
                    </button>
                  ))}
                  {searchAccounts(
                    toAccountSearch,
                    transactionForm.debit_account_id
                  ).length === 0 && (
                    <div className="text-center text-gray-500 py-3 text-sm">
                      No accounts found
                    </div>
                  )}
                </div>
              )}
            </div>
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
                !transactionForm.credit_account_id ||
                (transactionForm.transaction_type === "investment" &&
                  (!transactionForm.quantity || !transactionForm.price))
              }
              size="sm"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-1" />
                  Adding...
                </>
              ) : (
                "Add"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
