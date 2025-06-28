"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { supabase } from "@/lib/supabase";
import ChartOfAccounts from "@/components/ChartOfAccounts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Landmark,
  Plus,
  User,
  Tag,
  Shield,
  Palette,
  Search,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

// Types

interface AccountType {
  id: string;
  name: string;
  category: string;
  normal_balance?: string;
  description?: string;
  created_at?: string | null;
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
  account_types?: {
    id: string;
    name: string;
    category: string;
  } | null;
}

interface HierarchicalAccount extends Account {
  children: HierarchicalAccount[];
}

interface Tag {
  id: string;
  user_id: string | null;
  name: string;
  color: string | null;
  created_at: string | null;
}

export default function Settings() {
  const { user, loading, initialize } = useAuthStore();
  const router = useRouter();

  // State for account management
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [hasTransactions, setHasTransactions] = useState(false);
  const [expandedParentAccounts, setExpandedParentAccounts] = useState<
    Set<string>
  >(new Set());

  // State for tag management
  const [tags, setTags] = useState<Tag[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isEditTagModalOpen, setIsEditTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [tagSortOrder, setTagSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [tagsPerPage] = useState(10);

  // Account form state - Updated to match database schema
  const [accountForm, setAccountForm] = useState({
    name: "",
    code: "",
    account_type_id: "",
    parent_id: "none",
    description: "",
    initial_balance: "0",
    is_placeholder: false,
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    account_type_id: "",
    parent_id: "none",
    description: "",
    is_placeholder: false,
  });

  // Tag form state
  const [tagForm, setTagForm] = useState({
    name: "",
    color: "#3B82F6",
  });

  const [editTagForm, setEditTagForm] = useState({
    name: "",
    color: "#3B82F6",
  });

  // Fetch data from database
  const fetchAccountTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("account_types")
        .select("*")
        .order("name");

      if (error) throw error;
      setAccountTypes(data || []);
    } catch (error) {
      console.error("Error fetching account types:", error);
    }
  };

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
        .order("name");

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

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

  const loadData = async () => {
    await Promise.all([fetchAccountTypes(), fetchAccounts(), fetchTags()]);
  };

  // Check if account has transactions
  const checkAccountTransactions = async (accountId: string) => {
    try {
      const { data, error } = await supabase
        .from("transaction_entries")
        .select("id")
        .eq("account_id", accountId)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error("Error checking account transactions:", error);
      return false;
    }
  };

  // Build hierarchical account structure for parent selection
  const buildAccountHierarchy = (
    accounts: Account[]
  ): HierarchicalAccount[] => {
    const accountMap = new Map<string, HierarchicalAccount>();
    const rootAccounts: HierarchicalAccount[] = [];

    // First pass: create all nodes with children array
    accounts.forEach((account) => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    // Second pass: build hierarchy
    accounts.forEach((account) => {
      const node = accountMap.get(account.id);
      if (!node) return;

      if (account.parent_id && accountMap.has(account.parent_id)) {
        const parent = accountMap.get(account.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootAccounts.push(node);
      }
    });

    // Sort at each level
    const sortAccounts = (accountList: HierarchicalAccount[]) => {
      accountList.sort((a, b) => a.name.localeCompare(b.name));
      accountList.forEach((account) => {
        if (account.children.length > 0) {
          sortAccounts(account.children);
        }
      });
    };

    sortAccounts(rootAccounts);
    return rootAccounts;
  };

  // Toggle expand/collapse for parent account trees
  const toggleParentAccountExpand = (accountId: string) => {
    const newExpanded = new Set(expandedParentAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedParentAccounts(newExpanded);
  };

  // Render hierarchical account options
  const renderAccountOptions = (
    accountList: HierarchicalAccount[],
    level: number = 0
  ): React.ReactElement[] => {
    const options: React.ReactElement[] = [];

    accountList.forEach((account) => {
      const isSystemAccount = account.user_id === null;
      const icon = isSystemAccount ? "📁" : "💼";

      // Create visual hierarchy with proper indentation
      const indentLevel = level * 20; // 20px per level
      const treeLines = level > 0 ? "├── " : "";

      options.push(
        <SelectItem key={account.id} value={account.id}>
          <div
            className="flex items-center w-full"
            style={{ paddingLeft: `${indentLevel}px` }}
          >
            <span className="text-gray-400 font-mono text-xs mr-1">
              {treeLines}
            </span>
            <span className="mr-2">{icon}</span>
            <span
              className={`font-medium ${
                isSystemAccount ? "text-blue-700" : "text-gray-900"
              }`}
            >
              {account.name}
            </span>
            {account.account_types && (
              <span className="text-xs text-gray-500 ml-2">
                ({account.account_types.name})
              </span>
            )}
            {isSystemAccount && (
              <span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded ml-2">
                System
              </span>
            )}
          </div>
        </SelectItem>
      );

      // Add children recursively
      if (account.children.length > 0) {
        options.push(...renderAccountOptions(account.children, level + 1));
      }
    });

    return options;
  };

  useEffect(() => {
    if (!user && loading) {
      initialize();
    }
  }, [user, loading, initialize]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const initialBalance = accountForm.is_placeholder
        ? 0
        : parseFloat(accountForm.initial_balance) || 0;

      // Step 1: Create the account
      const { data: newAccount, error: accountError } = await supabase
        .from("accounts")
        .insert({
          user_id: user.id,
          name: accountForm.name,
          code: accountForm.code || null,
          account_type_id: accountForm.account_type_id,
          parent_id:
            !accountForm.parent_id || accountForm.parent_id === "none"
              ? null
              : accountForm.parent_id,
          description: accountForm.description || null,
          balance: initialBalance,
          is_placeholder: accountForm.is_placeholder,
          is_active: true,
        })
        .select()
        .single();

      if (accountError) throw accountError;

      // Step 2: If initial balance > 0, create opening balance transaction
      if (initialBalance > 0 && newAccount) {
        // Find the "Opening Balance" account (it should be under Equity account)
        let openingBalanceAccount = null;

        // First, find the Equity account (parent)
        const { data: equityAccount, error: equityError } = await supabase
          .from("accounts")
          .select("id, name, user_id")
          .eq("name", "Equity")
          .filter("user_id", "is", null)
          .single();

        if (equityError || !equityAccount) {
          console.error("Equity account not found:", equityError);
          throw new Error(
            "Database not properly initialized - Equity account missing"
          );
        }

        // Now find the Opening Balance account under Equity
        const { data: openingBalance, error: openingBalanceError } =
          await supabase
            .from("accounts")
            .select("id, name, user_id, parent_id")
            .eq("name", "Opening Balance")
            .eq("parent_id", equityAccount.id)
            .filter("user_id", "is", null)
            .single();

        if (!openingBalanceError && openingBalance) {
          openingBalanceAccount = openingBalance;
        } else {
          // Get the Equity account type for the new Opening Balance account
          const { data: equityAccountType, error: typeError } = await supabase
            .from("account_types")
            .select("id")
            .eq("name", "Equity")
            .single();

          if (typeError || !equityAccountType) {
            console.error("Equity account type not found:", typeError);
            throw new Error(
              "Database not properly initialized - Equity account type missing"
            );
          }

          // Create the Opening Balance account
          const { data: newOpeningBalance, error: createError } = await supabase
            .from("accounts")
            .insert({
              user_id: null,
              parent_id: equityAccount.id,
              account_type_id: equityAccountType.id,
              name: "Opening Balance",
              is_placeholder: false,
              is_active: true,
              balance: 0,
            })
            .select("id, name, user_id, parent_id")
            .single();

          if (createError || !newOpeningBalance) {
            console.error(
              "Failed to create Opening Balance account:",
              createError
            );
            throw new Error("Could not create Opening Balance account");
          }

          openingBalanceAccount = newOpeningBalance;
        }

        // Create the transaction
        const { data: transaction, error: transactionError } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            reference_number: `INIT-${newAccount.id.substring(0, 8)}`,
            description: `Initial balance for ${accountForm.name}`,
            transaction_date: new Date().toISOString().split("T")[0], // Today's date
            total_amount: initialBalance,
            notes: `Opening balance transaction for account: ${accountForm.name}`,
          })
          .select()
          .single();

        if (transactionError) throw transactionError;

        // Create the double entries
        const transactionEntries = [
          {
            transaction_id: transaction.id,
            account_id: openingBalanceAccount.id, // Debit Opening Balance
            quantity: 1,
            price: initialBalance,
            entry_type: "DEBIT" as const,
            amount: initialBalance,
            description: `Initial balance for ${accountForm.name}`,
          },
          {
            transaction_id: transaction.id,
            account_id: newAccount.id, // Credit the new account
            quantity: 1,
            price: initialBalance,
            entry_type: "CREDIT" as const,
            amount: initialBalance,
            description: `Initial balance for ${accountForm.name}`,
          },
        ];

        const { error: entriesError } = await supabase
          .from("transaction_entries")
          .insert(transactionEntries);

        if (entriesError) throw entriesError;
      }

      // Refresh accounts list
      await fetchAccounts();

      // Trigger Chart of Accounts refresh
      setRefreshTrigger((prev) => prev + 1);

      // Reset form and close modal
      setAccountForm({
        name: "",
        code: "",
        account_type_id: "",
        parent_id: "",
        description: "",
        initial_balance: "0",
        is_placeholder: false,
      });
      setIsAccountModalOpen(false);
    } catch (error) {
      console.error("Error creating account:", error);
      alert("Error creating account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit account
  const handleEditAccount = async (account: Account) => {
    setEditingAccount(account);

    // Check if account has transactions
    const accountHasTransactions = await checkAccountTransactions(account.id);
    setHasTransactions(accountHasTransactions);

    // Populate edit form
    setEditForm({
      name: account.name,
      code: account.code || "",
      account_type_id: account.account_type_id || "",
      parent_id: account.parent_id || "none",
      description: account.description || "",
      is_placeholder: account.is_placeholder || false,
    });

    setIsEditModalOpen(true);
  };

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingAccount) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("accounts")
        .update({
          name: editForm.name,
          code: editForm.code || null,
          account_type_id: hasTransactions
            ? editingAccount.account_type_id
            : editForm.account_type_id,
          parent_id:
            !editForm.parent_id || editForm.parent_id === "none"
              ? null
              : editForm.parent_id,
          description: editForm.description || null,
          is_placeholder: editForm.is_placeholder,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingAccount.id);

      if (error) throw error;

      // Refresh accounts list
      await fetchAccounts();

      // Trigger Chart of Accounts refresh
      setRefreshTrigger((prev) => prev + 1);

      // Reset form and close modal
      setEditForm({
        name: "",
        code: "",
        account_type_id: "",
        parent_id: "none",
        description: "",
        is_placeholder: false,
      });
      setEditingAccount(null);
      setIsEditModalOpen(false);
      setHasTransactions(false);
    } catch (error) {
      console.error("Error updating account:", error);
      alert("Error updating account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tag management functions
  const handleTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("tags").insert({
        user_id: user.id,
        name: tagForm.name,
        color: tagForm.color,
      });

      if (error) throw error;

      // Refresh tags list
      await fetchTags();

      // Reset form and close modal
      setTagForm({
        name: "",
        color: "#3B82F6",
      });
      setIsTagModalOpen(false);
    } catch (error) {
      console.error("Error creating tag:", error);
      alert("Error creating tag. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingTag) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("tags")
        .update({
          name: editTagForm.name,
          color: editTagForm.color,
        })
        .eq("id", editingTag.id);

      if (error) throw error;

      // Refresh tags list
      await fetchTags();

      // Reset form and close modal
      setEditTagForm({
        name: "",
        color: "#3B82F6",
      });
      setEditingTag(null);
      setIsEditTagModalOpen(false);
    } catch (error) {
      console.error("Error updating tag:", error);
      alert("Error updating tag. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;

    try {
      const { error } = await supabase.from("tags").delete().eq("id", tagId);

      if (error) throw error;

      // Refresh tags list
      await fetchTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      alert("Error deleting tag. Please try again.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account preferences and application settings
          </p>
        </div>

        <Tabs defaultValue="accounts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
            <TabsTrigger
              value="accounts"
              className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3"
            >
              <Landmark className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Accounts</span>
              <span className="sm:hidden">Acc</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3"
            >
              <User className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Profile</span>
              <span className="sm:hidden">Pro</span>
            </TabsTrigger>
            <TabsTrigger
              value="tags"
              className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3 col-span-2 md:col-span-1"
            >
              <Tag className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Tags</span>
              <span className="sm:hidden">Tags</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3"
            >
              <Shield className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Security</span>
              <span className="sm:hidden">Sec</span>
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3"
            >
              <Palette className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Appearance</span>
              <span className="sm:hidden">App</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Landmark className="h-4 w-4 md:h-5 md:w-5" />
                    Chart of Accounts
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Manage your account hierarchy and create new accounts
                  </CardDescription>
                </div>
                <Dialog
                  open={isAccountModalOpen}
                  onOpenChange={setIsAccountModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2 w-full sm:w-auto">
                      <Plus className="h-4 w-4" />
                      Add Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-4">
                      <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <Plus className="h-5 w-5 text-green-600" />
                        Add New Account
                      </DialogTitle>
                      <DialogDescription className="text-sm text-gray-600">
                        Create a new account in your chart of accounts. This
                        will be used for tracking transactions and balances.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAccountSubmit} className="space-y-6">
                      {/* Basic Information Section */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
                          Basic Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="accountName"
                              className="text-sm font-medium"
                            >
                              Account Name *
                            </Label>
                            <Input
                              id="accountName"
                              value={accountForm.name}
                              onChange={(e) =>
                                setAccountForm({
                                  ...accountForm,
                                  name: e.target.value,
                                })
                              }
                              placeholder="e.g., HDFC Savings Account"
                              className="h-10"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="accountCode"
                              className="text-sm font-medium"
                            >
                              Account Code
                            </Label>
                            <Input
                              id="accountCode"
                              value={accountForm.code}
                              onChange={(e) =>
                                setAccountForm({
                                  ...accountForm,
                                  code: e.target.value,
                                })
                              }
                              placeholder="e.g., HDFC-SAV-001"
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Account Classification Section */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
                          Account Classification
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="accountType"
                              className="text-sm font-medium"
                            >
                              Account Type *
                            </Label>
                            <Select
                              value={accountForm.account_type_id}
                              onValueChange={(value) =>
                                setAccountForm({
                                  ...accountForm,
                                  account_type_id: value,
                                })
                              }
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                              <SelectContent>
                                {accountTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    <div className="flex items-center gap-3 py-1">
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                                        {type.category}
                                      </span>
                                      <span className="font-medium">
                                        {type.name}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="initialBalance"
                              className="text-sm font-medium"
                            >
                              Initial Balance (₹)
                            </Label>
                            <Input
                              id="initialBalance"
                              type="number"
                              step="0.01"
                              value={
                                accountForm.is_placeholder
                                  ? "0"
                                  : accountForm.initial_balance
                              }
                              onChange={(e) =>
                                setAccountForm({
                                  ...accountForm,
                                  initial_balance: e.target.value,
                                })
                              }
                              placeholder="0.00"
                              className={`h-10 ${
                                accountForm.is_placeholder
                                  ? "bg-gray-50 cursor-not-allowed"
                                  : ""
                              }`}
                              disabled={accountForm.is_placeholder}
                            />
                            {accountForm.is_placeholder && (
                              <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
                                <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>
                                <p className="text-xs text-gray-600">
                                  Placeholder accounts cannot have balances
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Account Hierarchy Section */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
                          Account Hierarchy
                        </h3>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">
                            Parent Account
                          </Label>
                          <div className="border rounded-lg p-2 bg-gray-50 max-h-64 overflow-y-auto">
                            <div className="space-y-0.5">
                              {/* No Parent Option */}
                              <div
                                className={`flex items-center py-1 px-1 rounded text-sm transition-colors cursor-pointer ${
                                  !accountForm.parent_id ||
                                  accountForm.parent_id === "none"
                                    ? "bg-blue-100 border border-blue-300"
                                    : "hover:bg-gray-100"
                                }`}
                                onClick={() =>
                                  setAccountForm({
                                    ...accountForm,
                                    parent_id: "",
                                  })
                                }
                              >
                                <span className="w-4 mr-1"></span>
                                <span
                                  className={`flex-1 ${
                                    !accountForm.parent_id ||
                                    accountForm.parent_id === "none"
                                      ? "text-blue-700 font-medium"
                                      : "text-gray-900"
                                  }`}
                                >
                                  No Parent (Top Level)
                                </span>
                                {(!accountForm.parent_id ||
                                  accountForm.parent_id === "none") && (
                                  <span className="text-blue-600 text-xs">
                                    ✓
                                  </span>
                                )}
                              </div>

                              {(() => {
                                const hierarchicalAccounts =
                                  buildAccountHierarchy(accounts);

                                const renderAccountTree = (
                                  account: HierarchicalAccount,
                                  level: number = 0
                                ): React.ReactElement => {
                                  const isSelected =
                                    accountForm.parent_id === account.id;
                                  const canSelect = true; // All accounts can be parents when creating
                                  const isExpanded = expandedParentAccounts.has(
                                    account.id
                                  );
                                  const hasChildren =
                                    account.children.length > 0;

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
                                          paddingLeft: `${4 + level * 16}px`,
                                        }}
                                      >
                                        {hasChildren && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleParentAccountExpand(
                                                account.id
                                              );
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
                                        {!hasChildren && (
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
                                              setAccountForm({
                                                ...accountForm,
                                                parent_id: account.id,
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
                                      {hasChildren && isExpanded && (
                                        <div>
                                          {account.children.map((child) =>
                                            renderAccountTree(child, level + 1)
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                };

                                return hierarchicalAccounts.map((account) =>
                                  renderAccountTree(account, 0)
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Additional Details Section */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
                          Additional Details
                        </h3>

                        <div className="space-y-2">
                          <Label
                            htmlFor="description"
                            className="text-sm font-medium"
                          >
                            Description
                          </Label>
                          <Textarea
                            id="description"
                            value={accountForm.description}
                            onChange={(e) =>
                              setAccountForm({
                                ...accountForm,
                                description: e.target.value,
                              })
                            }
                            placeholder="Optional description for this account"
                            rows={3}
                            className="resize-none"
                          />
                        </div>

                        <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            id="isPlaceholder"
                            checked={accountForm.is_placeholder}
                            onChange={(e) =>
                              setAccountForm({
                                ...accountForm,
                                is_placeholder: e.target.checked,
                              })
                            }
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="space-y-1">
                            <Label
                              htmlFor="isPlaceholder"
                              className="text-sm font-medium cursor-pointer"
                            >
                              Placeholder Account
                            </Label>
                            <p className="text-xs text-gray-600">
                              This account is used for organization only and
                              cannot hold transactions
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-3 pt-6 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAccountModalOpen(false)}
                          disabled={isSubmitting}
                          className="px-6"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 bg-green-600 hover:bg-green-700"
                        >
                          {isSubmitting ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Creating...
                            </div>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Edit Account Modal */}
                <Dialog
                  open={isEditModalOpen}
                  onOpenChange={setIsEditModalOpen}
                >
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-4">
                      <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-blue-600" />
                        Edit Account
                      </DialogTitle>
                      <DialogDescription className="text-sm text-gray-600">
                        Update account details. Account type cannot be changed
                        if the account has transactions.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-6">
                      {/* Basic Information Section */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
                          Basic Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="editAccountName"
                              className="text-sm font-medium"
                            >
                              Account Name *
                            </Label>
                            <Input
                              id="editAccountName"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                              placeholder="e.g., HDFC Savings Account"
                              className="h-10"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="editAccountCode"
                              className="text-sm font-medium"
                            >
                              Account Code
                            </Label>
                            <Input
                              id="editAccountCode"
                              value={editForm.code}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  code: e.target.value,
                                })
                              }
                              placeholder="e.g., HDFC-SAV-001"
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Account Classification Section */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
                          Account Classification
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="editAccountType"
                              className="text-sm font-medium"
                            >
                              Account Type *
                            </Label>
                            <Select
                              value={editForm.account_type_id}
                              onValueChange={(value) =>
                                setEditForm({
                                  ...editForm,
                                  account_type_id: value,
                                })
                              }
                              disabled={hasTransactions}
                            >
                              <SelectTrigger
                                className={`h-10 ${
                                  hasTransactions
                                    ? "bg-gray-50 cursor-not-allowed"
                                    : ""
                                }`}
                              >
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                              <SelectContent>
                                {accountTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    <div className="flex items-center gap-3 py-1">
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                                        {type.category}
                                      </span>
                                      <span className="font-medium">
                                        {type.name}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {hasTransactions && (
                              <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                                <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></div>
                                <p className="text-xs text-amber-700">
                                  Account type is locked because this account
                                  has transactions
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="editParentAccount"
                              className="text-sm font-medium"
                            >
                              Parent Account
                            </Label>
                            <Select
                              value={editForm.parent_id || "none"}
                              onValueChange={(value) =>
                                setEditForm({
                                  ...editForm,
                                  parent_id: value === "none" ? "" : value,
                                })
                              }
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select parent account" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                <SelectItem value="none">
                                  <div className="flex items-center gap-2 py-1">
                                    <span className="text-lg">🏠</span>
                                    <span className="font-medium">
                                      No Parent (Top Level)
                                    </span>
                                  </div>
                                </SelectItem>
                                {(() => {
                                  const hierarchicalAccounts =
                                    buildAccountHierarchy(
                                      accounts.filter(
                                        (acc) => acc.id !== editingAccount?.id
                                      )
                                    );
                                  return (
                                    <>
                                      {hierarchicalAccounts.length > 0 && (
                                        <>
                                          <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-t">
                                            Available Parent Accounts
                                          </div>
                                          {renderAccountOptions(
                                            hierarchicalAccounts
                                          )}
                                        </>
                                      )}
                                    </>
                                  );
                                })()}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Additional Details Section */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
                          Additional Details
                        </h3>

                        <div className="space-y-2">
                          <Label
                            htmlFor="editDescription"
                            className="text-sm font-medium"
                          >
                            Description
                          </Label>
                          <Textarea
                            id="editDescription"
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                description: e.target.value,
                              })
                            }
                            placeholder="Optional description for this account"
                            rows={3}
                            className="resize-none"
                          />
                        </div>

                        <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            id="editIsPlaceholder"
                            checked={editForm.is_placeholder}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                is_placeholder: e.target.checked,
                              })
                            }
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="space-y-1">
                            <Label
                              htmlFor="editIsPlaceholder"
                              className="text-sm font-medium cursor-pointer"
                            >
                              Placeholder Account
                            </Label>
                            <p className="text-xs text-gray-600">
                              This account is used for organization only and
                              cannot hold transactions
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-3 pt-6 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditModalOpen(false);
                            setEditingAccount(null);
                            setHasTransactions(false);
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
                              Updating...
                            </div>
                          ) : (
                            "Update Account"
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <ChartOfAccounts
                  showHeader={false}
                  maxHeight="h-[calc(100vh-300px)] sm:h-[calc(100vh-400px)]"
                  refreshTrigger={refreshTrigger}
                  onEditAccount={handleEditAccount}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Profile settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tags" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Tag className="h-4 w-4 md:h-5 md:w-5" />
                    Tag Manager
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Manage tags for organizing your transactions
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsTagModalOpen(true)}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add Tag
                </Button>
              </CardHeader>
              <CardContent>
                {/* Search and Sort Controls */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search tags..."
                      value={tagSearchTerm}
                      onChange={(e) => setTagSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setTagSortOrder(tagSortOrder === "asc" ? "desc" : "asc")
                    }
                    className="flex items-center gap-2"
                  >
                    Sort by Name {tagSortOrder === "asc" ? "↑" : "↓"}
                  </Button>
                </div>

                {/* Tags Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tag
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Color
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(() => {
                          // Filter and sort tags
                          const filteredTags = tags.filter((tag) =>
                            tag.name
                              .toLowerCase()
                              .includes(tagSearchTerm.toLowerCase())
                          );

                          const sortedTags = [...filteredTags].sort((a, b) => {
                            if (tagSortOrder === "asc") {
                              return a.name.localeCompare(b.name);
                            } else {
                              return b.name.localeCompare(a.name);
                            }
                          });

                          // Pagination
                          const startIndex = (currentPage - 1) * tagsPerPage;
                          const endIndex = startIndex + tagsPerPage;
                          const paginatedTags = sortedTags.slice(
                            startIndex,
                            endIndex
                          );
                          const totalPages = Math.ceil(
                            sortedTags.length / tagsPerPage
                          );

                          if (paginatedTags.length === 0) {
                            return (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-4 py-8 text-center text-gray-500"
                                >
                                  {tagSearchTerm
                                    ? "No tags found matching your search."
                                    : "No tags created yet. Create your first tag!"}
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <>
                              {paginatedTags.map((tag) => (
                                <tr key={tag.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="w-4 h-4 rounded-full border border-gray-200"
                                        style={{
                                          backgroundColor:
                                            tag.color || "#3B82F6",
                                        }}
                                      ></div>
                                      <span className="text-sm font-medium text-gray-900">
                                        {tag.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-500 font-mono">
                                      {tag.color || "#3B82F6"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {tag.created_at
                                      ? new Date(
                                          tag.created_at
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingTag(tag);
                                          setEditTagForm({
                                            name: tag.name,
                                            color: tag.color || "#3B82F6",
                                          });
                                          setIsEditTagModalOpen(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-900"
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteTag(tag.id)}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}

                              {/* Pagination Row */}
                              {totalPages > 1 && (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="px-4 py-4 bg-gray-50"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="text-sm text-gray-700">
                                        Showing {startIndex + 1} to{" "}
                                        {Math.min(endIndex, sortedTags.length)}{" "}
                                        of {sortedTags.length} tags
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            setCurrentPage(currentPage - 1)
                                          }
                                          disabled={currentPage === 1}
                                        >
                                          <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm text-gray-700">
                                          Page {currentPage} of {totalPages}
                                        </span>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            setCurrentPage(currentPage + 1)
                                          }
                                          disabled={currentPage === totalPages}
                                        >
                                          <ChevronRight className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and privacy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Security settings coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize the look and feel of your application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Appearance settings coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Tag Modals */}
        {/* Add Tag Modal */}
        <Dialog open={isTagModalOpen} onOpenChange={setIsTagModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Add New Tag
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Create a new tag for organizing your transactions.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleTagSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tagName" className="text-sm font-medium">
                    Tag Name *
                  </Label>
                  <Input
                    id="tagName"
                    value={tagForm.name}
                    onChange={(e) =>
                      setTagForm({
                        ...tagForm,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., Food, Travel, Business"
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Color</Label>
                  <div className="grid grid-cols-8 gap-2">
                    {[
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
                      "#F43F5E",
                      "#64748B",
                      "#6B7280",
                      "#374151",
                    ].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setTagForm({ ...tagForm, color })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          tagForm.color === color
                            ? "border-gray-800 scale-110"
                            : "border-gray-300 hover:border-gray-500"
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTagModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </div>
                  ) : (
                    "Create Tag"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Tag Modal */}
        <Dialog open={isEditTagModalOpen} onOpenChange={setIsEditTagModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5 text-blue-600" />
                Edit Tag
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Update tag details.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditTagSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editTagName" className="text-sm font-medium">
                    Tag Name *
                  </Label>
                  <Input
                    id="editTagName"
                    value={editTagForm.name}
                    onChange={(e) =>
                      setEditTagForm({
                        ...editTagForm,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., Food, Travel, Business"
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Color</Label>
                  <div className="grid grid-cols-8 gap-2">
                    {[
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
                      "#F43F5E",
                      "#64748B",
                      "#6B7280",
                      "#374151",
                    ].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setEditTagForm({ ...editTagForm, color })
                        }
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          editTagForm.color === color
                            ? "border-gray-800 scale-110"
                            : "border-gray-300 hover:border-gray-500"
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditTagModalOpen(false);
                    setEditingTag(null);
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
                      Updating...
                    </div>
                  ) : (
                    "Update Tag"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
