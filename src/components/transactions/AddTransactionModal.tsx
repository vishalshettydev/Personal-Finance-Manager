"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Receipt,
  AlertCircle,
  Search,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Tag } from "@/lib/types";
import { AccountingEngine } from "@/lib/accounting";

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

interface HierarchicalAccount extends Account {
  level: number;
  isSelectable: boolean;
  hasChildren: boolean;
  children: HierarchicalAccount[];
}

interface TransactionFormData {
  description: string;
  reference_number: string;
  transaction_date: string;
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
    amount: "",
    notes: "",
    debit_account_id: "",
    credit_account_id: "",
    selected_tags: [],
  });

  // UI states for dropdowns
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [expandedFromAccounts, setExpandedFromAccounts] = useState<Set<string>>(
    new Set()
  );
  const [expandedToAccounts, setExpandedToAccounts] = useState<Set<string>>(
    new Set()
  );

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

  // Build hierarchical account list
  const buildAccountHierarchy = (
    accountsList: Account[],
    parentId: string | null = null,
    level = 0
  ): HierarchicalAccount[] => {
    const result: HierarchicalAccount[] = [];
    const children = accountsList.filter((acc) => acc.parent_id === parentId);

    for (const child of children) {
      const childAccounts = accountsList.filter(
        (acc) => acc.parent_id === child.id
      );
      result.push({
        ...child,
        level: level,
        isSelectable: !child.is_placeholder,
        hasChildren: childAccounts.length > 0,
        children:
          childAccounts.length > 0
            ? buildAccountHierarchy(accountsList, child.id, level + 1)
            : [],
      });
    }

    return result;
  };

  // Toggle expand/collapse for account trees
  const toggleFromAccountExpand = (accountId: string) => {
    const newExpanded = new Set(expandedFromAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedFromAccounts(newExpanded);
  };

  const toggleToAccountExpand = (accountId: string) => {
    const newExpanded = new Set(expandedToAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedToAccounts(newExpanded);
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
      amount: "",
      notes: "",
      debit_account_id: "",
      credit_account_id: "",
      selected_tags: [],
    });
    setTagSearchTerm("");
    setExpandedFromAccounts(new Set());
    setExpandedToAccounts(new Set());
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const amount = parseFloat(transactionForm.amount);
      if (amount <= 0) {
        alert("Amount must be greater than 0");
        return;
      }

      // Create transaction entries for double-entry
      const entries = [
        {
          account_id: transactionForm.debit_account_id,
          quantity: 1,
          price: amount,
          entry_type: "DEBIT" as const,
          amount: amount,
          description: transactionForm.description,
        },
        {
          account_id: transactionForm.credit_account_id,
          quantity: 1,
          price: amount,
          entry_type: "CREDIT" as const,
          amount: amount,
          description: transactionForm.description,
        },
      ];

      // Validate double-entry
      if (!AccountingEngine.validateTransaction(entries)) {
        alert("Invalid transaction: Debits must equal credits");
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

      alert("Transaction added successfully!");
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert("Error creating transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render account tree
  const renderAccountTree = (
    account: HierarchicalAccount,
    isFromTree: boolean
  ): React.ReactNode => {
    const isSelected = isFromTree
      ? transactionForm.debit_account_id === account.id
      : transactionForm.credit_account_id === account.id;

    const canSelect = isFromTree
      ? !account.is_placeholder
      : !account.is_placeholder &&
        account.id !== transactionForm.debit_account_id;

    const isFromAccount =
      !isFromTree && account.id === transactionForm.debit_account_id;
    const expandedSet = isFromTree ? expandedFromAccounts : expandedToAccounts;
    const toggleExpand = isFromTree
      ? toggleFromAccountExpand
      : toggleToAccountExpand;
    const isExpanded = expandedSet.has(account.id);

    return (
      <div key={account.id}>
        <div
          className={`flex items-center py-1 px-1 rounded text-sm transition-colors ${
            isFromAccount
              ? "opacity-50 cursor-not-allowed"
              : isSelected
              ? "bg-blue-100 border border-blue-300"
              : canSelect
              ? "hover:bg-gray-100 cursor-pointer"
              : "cursor-default"
          }`}
          style={{
            paddingLeft: `${4 + account.level * 16}px`,
          }}
        >
          {account.hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(account.id);
              }}
              className="mr-1 p-0.5 hover:bg-gray-200 rounded"
              disabled={isFromAccount}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          {!account.hasChildren && <span className="w-4 mr-1"></span>}
          <span
            className={`flex-1 ${
              isFromAccount
                ? "text-gray-400"
                : account.is_placeholder
                ? "text-gray-600 font-medium"
                : isSelected
                ? "text-blue-700 font-medium"
                : "text-gray-900"
            }`}
            onClick={() => {
              if (canSelect && !isFromAccount) {
                if (isFromTree) {
                  setTransactionForm({
                    ...transactionForm,
                    debit_account_id: account.id,
                    credit_account_id: "",
                  });
                } else {
                  setTransactionForm({
                    ...transactionForm,
                    credit_account_id: account.id,
                  });
                }
              }
            }}
          >
            {account.name}
          </span>
          {isSelected && <span className="text-blue-600 text-xs">✓</span>}
        </div>
        {account.hasChildren && isExpanded && (
          <div>
            {account.children.map((child) =>
              renderAccountTree(child, isFromTree)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          <span>Add Transaction</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            Add New Transaction
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Record a new transaction by specifying where money is coming from
            and where it&rsquo;s going.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleTransactionSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
              Transaction Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="e.g., Office supplies purchase"
                  className="h-10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="reference_number"
                  className="text-sm font-medium"
                >
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
                  placeholder="e.g., INV-001, CHQ-123"
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="transaction_date"
                  className="text-sm font-medium"
                >
                  Transaction Date *
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
                  className="h-10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
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
                  className="h-10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Account Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
              Account Selection
            </h3>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-blue-600 mr-2" />
                <p className="text-sm text-blue-700">
                  Select where the money is coming from and where it&rsquo;s
                  going to.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* From Account Tree */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">From Account *</Label>
                <div className="border rounded-lg p-2 bg-gray-50 max-h-64 overflow-y-auto">
                  <div className="space-y-0.5">
                    {buildAccountHierarchy(accounts).map((account) =>
                      renderAccountTree(account, true)
                    )}
                  </div>
                </div>
              </div>

              {/* To Account Tree */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">To Account *</Label>
                <div
                  className={`border rounded-lg p-2 max-h-64 overflow-y-auto ${
                    !transactionForm.debit_account_id
                      ? "bg-gray-50 opacity-50"
                      : "bg-white"
                  }`}
                >
                  {!transactionForm.debit_account_id ? (
                    <div className="text-center text-gray-500 py-8">
                      Select from account first
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {buildAccountHierarchy(accounts).map((account) =>
                        renderAccountTree(account, false)
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
              Tags (Optional)
            </h3>

            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
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
                  placeholder="Search tags or type to create new..."
                  className="pl-10 h-10"
                />
              </div>

              {/* Tag suggestions */}
              {tagSearchTerm && (
                <div className="border rounded-md max-h-32 overflow-y-auto">
                  {getFilteredTags().map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagSelect(tag)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: tag.color || "#3B82F6",
                        }}
                      />
                      {tag.name}
                    </button>
                  ))}
                  {getFilteredTags().length === 0 && tagSearchTerm.trim() && (
                    <button
                      type="button"
                      onClick={handleTagCreate}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-blue-600"
                    >
                      <Plus className="w-3 h-3" />
                      Create &quot;{tagSearchTerm}&quot;
                    </button>
                  )}
                </div>
              )}

              {/* Selected tags */}
              {transactionForm.selected_tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {transactionForm.selected_tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="flex items-center gap-1 px-1.5 py-0.5 text-xs h-6"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color || undefined,
                      }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: tag.color || "#3B82F6" }}
                      />
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag.id)}
                        className="ml-0.5 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
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
              placeholder="Additional notes about this transaction..."
              className="min-h-[80px]"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
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
