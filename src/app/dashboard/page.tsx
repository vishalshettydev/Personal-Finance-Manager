"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import ChartOfAccounts from "@/components/ChartOfAccounts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Building2,
  CreditCard,
  LineChart,
  Receipt,
  Smartphone,
  AlertCircle,
  X,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { supabase } from "@/lib/supabase";
import { Tag } from "@/lib/types";
import { AccountingEngine } from "@/lib/accounting";

// Define interfaces for better type safety
interface AccountType {
  id: string;
  name: string;
  category: string;
}

interface Account {
  id: string;
  user_id: string | null;
  parent_id?: string | null;
  account_type_id: string | null;
  name: string;
  code?: string | null;
  description?: string | null;
  is_placeholder?: boolean | null;
  is_active: boolean | null;
  balance: number | null;
  created_at: string | null;
  updated_at: string | null;
  account_types?: AccountType | null;
}

interface HierarchicalAccount extends Account {
  level: number;
  isSelectable: boolean;
  hasChildren: boolean;
  children: HierarchicalAccount[];
}

export default function Dashboard() {
  const { user, loading, initialize } = useAuthStore();
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data states
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Transaction form state - Double Entry
  const [transactionForm, setTransactionForm] = useState({
    description: "",
    reference_number: "",
    transaction_date: new Date().toISOString().split("T")[0],
    amount: "",
    notes: "",
    debit_account_id: "",
    credit_account_id: "",
    selected_tags: [] as Tag[],
  });

  // UI states for dropdowns
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [expandedFromAccounts, setExpandedFromAccounts] = useState<Set<string>>(
    new Set()
  );
  const [expandedToAccounts, setExpandedToAccounts] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (!user && loading) {
      initialize();
    }
  }, [user, loading, initialize]);

  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchTags();
    }
  }, [user]);

  // Function to format currency in Indian Rupees
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Fetch accounts from database
  const fetchAccounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("accounts")
        .select(
          `
          *,
          account_types (
            id,
            name,
            category
          )
        `
        )
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      console.log("Fetched accounts:", data); // Debug log
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  // Fetch tags from database
  const fetchTags = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  // Create a new tag instantly
  const createTagInstantly = async (tagName: string): Promise<Tag | null> => {
    if (!user) return null;

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
          user_id: user.id,
          name: tagName,
          color: randomColor,
        })
        .select()
        .single();

      if (error) throw error;

      // Update tags list
      setTags((prev) => [...prev, data]);
      return data;
    } catch (error) {
      console.error("Error creating tag:", error);
      return null;
    }
  };

  // Build hierarchical account list with children info
  const buildAccountHierarchy = (
    accounts: Account[],
    parentId: string | null = null,
    level = 0
  ): HierarchicalAccount[] => {
    const result: HierarchicalAccount[] = [];
    const children = accounts.filter((acc) => acc.parent_id === parentId);

    for (const child of children) {
      const childAccounts = accounts.filter(
        (acc) => acc.parent_id === child.id
      );
      result.push({
        ...child,
        level: level,
        isSelectable: !child.is_placeholder,
        hasChildren: childAccounts.length > 0,
        children:
          childAccounts.length > 0
            ? buildAccountHierarchy(accounts, child.id, level + 1)
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

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

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
          debit_amount: amount,
          credit_amount: 0,
          description: transactionForm.description,
        },
        {
          account_id: transactionForm.credit_account_id,
          debit_amount: 0,
          credit_amount: amount,
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
          user_id: user.id,
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

      // Reset form but keep modal open for next transaction
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

      // Show success feedback without alert
      console.log("Transaction added successfully!");
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert("Error creating transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">
            Please sign in to access your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.email}!
            </h1>
            <p className="text-gray-600">
              Here&apos;s an overview of your financial data.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-3">
            <Dialog
              open={isTransactionModalOpen}
              onOpenChange={setIsTransactionModalOpen}
            >
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700">
                  <Receipt className="h-4 w-4" />
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
                    Record a new transaction by specifying where money is coming
                    from and where it&apos;s going.
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
                        <Label
                          htmlFor="description"
                          className="text-sm font-medium"
                        >
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
                          Select where the money is coming from and where
                          it&apos;s going to.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* From Account Tree */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          From Account *
                        </Label>
                        <div className="border rounded-lg p-2 bg-gray-50 max-h-64 overflow-y-auto">
                          <div className="space-y-0.5">
                            {(() => {
                              const hierarchicalAccounts =
                                buildAccountHierarchy(accounts);

                              const renderAccountTree = (
                                account: HierarchicalAccount
                              ): React.ReactElement => {
                                const isSelected =
                                  transactionForm.debit_account_id ===
                                  account.id;
                                const canSelect = !account.is_placeholder;
                                const isExpanded = expandedFromAccounts.has(
                                  account.id
                                );

                                return (
                                  <div key={account.id}>
                                    <div
                                      className={`flex items-center py-1 px-1 rounded text-sm transition-colors ${
                                        isSelected
                                          ? "bg-blue-100 border border-blue-300"
                                          : canSelect
                                          ? "hover:bg-gray-100 cursor-pointer"
                                          : "cursor-default"
                                      }`}
                                      style={{
                                        paddingLeft: `${
                                          4 + (account.level || 0) * 16
                                        }px`,
                                      }}
                                    >
                                      {account.hasChildren && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFromAccountExpand(account.id);
                                          }}
                                          className="mr-1 p-0.5 hover:bg-gray-200 rounded"
                                        >
                                          {isExpanded ? (
                                            <ChevronDown className="h-3 w-3" />
                                          ) : (
                                            <ChevronRight className="h-3 w-3" />
                                          )}
                                        </button>
                                      )}
                                      {!account.hasChildren && (
                                        <span className="w-4 mr-1"></span>
                                      )}
                                      <span
                                        className={`flex-1 ${
                                          account.is_placeholder
                                            ? "text-gray-600 font-medium"
                                            : isSelected
                                            ? "text-blue-700 font-medium"
                                            : "text-gray-900"
                                        }`}
                                        onClick={() => {
                                          if (canSelect) {
                                            setTransactionForm({
                                              ...transactionForm,
                                              debit_account_id: account.id,
                                              credit_account_id: "",
                                            });
                                          }
                                        }}
                                      >
                                        {account.name}
                                      </span>
                                      {isSelected && (
                                        <span className="text-blue-600 text-xs">
                                          ✓
                                        </span>
                                      )}
                                    </div>
                                    {account.hasChildren && isExpanded && (
                                      <div>
                                        {account.children.map(
                                          renderAccountTree
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              };

                              return hierarchicalAccounts.map(
                                renderAccountTree
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* To Account Tree */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          To Account *
                        </Label>
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
                              {(() => {
                                const hierarchicalAccounts =
                                  buildAccountHierarchy(accounts);

                                const renderAccountTree = (
                                  account: HierarchicalAccount
                                ): React.ReactElement => {
                                  const isSelected =
                                    transactionForm.credit_account_id ===
                                    account.id;
                                  const canSelect =
                                    !account.is_placeholder &&
                                    account.id !==
                                      transactionForm.debit_account_id;
                                  const isFromAccount =
                                    account.id ===
                                    transactionForm.debit_account_id;
                                  const isExpanded = expandedToAccounts.has(
                                    account.id
                                  );

                                  return (
                                    <div key={account.id}>
                                      <div
                                        className={`flex items-center py-1 px-1 rounded text-sm transition-colors ${
                                          isFromAccount
                                            ? "opacity-50 cursor-not-allowed"
                                            : isSelected
                                            ? "bg-blue-100 border border-blue-300 cursor-pointer"
                                            : canSelect
                                            ? "hover:bg-gray-100 cursor-pointer"
                                            : "cursor-default"
                                        }`}
                                        style={{
                                          paddingLeft: `${
                                            4 + (account.level || 0) * 16
                                          }px`,
                                        }}
                                      >
                                        {account.hasChildren && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleToAccountExpand(account.id);
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
                                        {!account.hasChildren && (
                                          <span className="w-4 mr-1"></span>
                                        )}
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
                                              setTransactionForm({
                                                ...transactionForm,
                                                credit_account_id: account.id,
                                              });
                                            }
                                          }}
                                        >
                                          {account.name}
                                        </span>
                                        {isSelected && (
                                          <span className="text-blue-600 text-xs">
                                            ✓
                                          </span>
                                        )}
                                      </div>
                                      {account.hasChildren && isExpanded && (
                                        <div>
                                          {account.children.map(
                                            renderAccountTree
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                };

                                return hierarchicalAccounts.map(
                                  renderAccountTree
                                );
                              })()}
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
                          {getFilteredTags().length === 0 &&
                            tagSearchTerm.trim() && (
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
                                color: tag.color,
                              }}
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: tag.color }}
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
                        setIsTransactionModalOpen(false);
                        setTransactionForm({
                          description: "",
                          reference_number: "",
                          transaction_date: new Date()
                            .toISOString()
                            .split("T")[0],
                          amount: "",
                          notes: "",
                          debit_account_id: "",
                          credit_account_id: "",
                          selected_tags: [],
                        });
                        setTagSearchTerm("");
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
          </div>
        </div>

        {/* Quick Stats - Full Width */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Balance Card */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total Balance
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatINR(1245000)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Income</span>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  {formatINR(420000)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center text-red-600">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Expenses</span>
                </div>
                <span className="text-sm font-semibold text-red-600">
                  {formatINR(315000)}
                </span>
              </div>
            </div>
          </div>

          {/* Net Worth Card */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <PiggyBank className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Net Worth
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatINR(1850000)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-blue-600">
                  <Building2 className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Assets</span>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  {formatINR(2150000)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center text-orange-600">
                  <CreditCard className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Liabilities</span>
                </div>
                <span className="text-sm font-semibold text-orange-600">
                  {formatINR(300000)}
                </span>
              </div>
            </div>
          </div>

          {/* Total Investments Card */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <LineChart className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total Investments
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatINR(875000)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Stocks</span>
                <span className="font-semibold text-gray-900">
                  {formatINR(450000)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1 text-sm">
                <span className="text-gray-600">Mutual Funds</span>
                <span className="font-semibold text-gray-900">
                  {formatINR(325000)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1 text-sm">
                <span className="text-gray-600">Bonds & FDs</span>
                <span className="font-semibold text-gray-900">
                  {formatINR(100000)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left Column - Accounts Tree View (30-40%) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    Chart of Accounts
                  </h2>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Double Entry
                  </span>
                </div>
              </div>
              <div className="p-4">
                <ChartOfAccounts showHeader={false} maxHeight="h-[500px]" />
              </div>
            </div>
          </div>

          {/* Right Column - Recent Transactions (60-70%) */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    Recent Transactions
                  </h2>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b hover:bg-gray-50 rounded-lg px-3 transition-colors">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-100 rounded-full mr-4">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Grocery Store
                        </p>
                        <p className="text-sm text-gray-500">
                          HDFC Primary Savings • Today, 2:30 PM
                        </p>
                      </div>
                    </div>
                    <span className="text-red-600 font-semibold">
                      -{formatINR(8532)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b hover:bg-gray-50 rounded-lg px-3 transition-colors">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-full mr-4">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Salary Deposit
                        </p>
                        <p className="text-sm text-gray-500">
                          ICICI Salary Account • Yesterday, 9:00 AM
                        </p>
                      </div>
                    </div>
                    <span className="text-green-600 font-semibold">
                      +{formatINR(210000)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b hover:bg-gray-50 rounded-lg px-3 transition-colors">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-100 rounded-full mr-4">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Electric Bill
                        </p>
                        <p className="text-sm text-gray-500">
                          HDFC Business Current • 2 days ago, 3:15 PM
                        </p>
                      </div>
                    </div>
                    <span className="text-red-600 font-semibold">
                      -{formatINR(12050)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b hover:bg-gray-50 rounded-lg px-3 transition-colors">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-full mr-4">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Mobile Recharge
                        </p>
                        <p className="text-sm text-gray-500">
                          Paytm Wallet • 3 days ago, 10:15 AM
                        </p>
                      </div>
                    </div>
                    <span className="text-red-600 font-semibold">
                      -{formatINR(599)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b hover:bg-gray-50 rounded-lg px-3 transition-colors">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-full mr-4">
                        <LineChart className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Equity SIP</p>
                        <p className="text-sm text-gray-500">
                          Equity Funds • 5 days ago, 8:00 AM
                        </p>
                      </div>
                    </div>
                    <span className="text-blue-600 font-semibold">
                      -{formatINR(25000)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
