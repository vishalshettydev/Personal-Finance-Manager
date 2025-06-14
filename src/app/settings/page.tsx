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
import { Landmark, Plus, User, Bell, Shield, Palette } from "lucide-react";

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

export default function Settings() {
  const { user, loading, initialize } = useAuthStore();
  const router = useRouter();

  // State for account management
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Account form state - Updated to match database schema
  const [accountForm, setAccountForm] = useState({
    name: "",
    code: "",
    account_type_id: "",
    parent_id: "none",
    description: "",
    initial_balance: "0",
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

  const loadData = async () => {
    await Promise.all([fetchAccountTypes(), fetchAccounts()]);
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
      const { error } = await supabase.from("accounts").insert({
        user_id: user.id,
        name: accountForm.name,
        code: accountForm.code || null,
        account_type_id: accountForm.account_type_id,
        parent_id:
          !accountForm.parent_id || accountForm.parent_id === "none"
            ? null
            : accountForm.parent_id,
        description: accountForm.description || null,
        balance: parseFloat(accountForm.initial_balance) || 0,
        is_active: true,
      });

      if (error) throw error;

      // Refresh accounts list
      await fetchAccounts();

      // Reset form and close modal
      setAccountForm({
        name: "",
        code: "",
        account_type_id: "",
        parent_id: "",
        description: "",
        initial_balance: "0",
      });
      setIsAccountModalOpen(false);
    } catch (error) {
      console.error("Error creating account:", error);
      alert("Error creating account. Please try again.");
    } finally {
      setIsSubmitting(false);
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
              value="notifications"
              className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3 col-span-2 md:col-span-1"
            >
              <Bell className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Notif</span>
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
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Account</DialogTitle>
                      <DialogDescription>
                        Create a new account in your chart of accounts. This
                        will be used for tracking transactions and balances.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAccountSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="accountName">Account Name *</Label>
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
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="accountCode">Account Code</Label>
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
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="accountType">Account Type *</Label>
                          <Select
                            value={accountForm.account_type_id}
                            onValueChange={(value) =>
                              setAccountForm({
                                ...accountForm,
                                account_type_id: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                            <SelectContent>
                              {accountTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name} ({type.category})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="initialBalance">
                            Initial Balance
                          </Label>
                          <Input
                            id="initialBalance"
                            type="number"
                            step="0.01"
                            value={accountForm.initial_balance}
                            onChange={(e) =>
                              setAccountForm({
                                ...accountForm,
                                initial_balance: e.target.value,
                              })
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="parentAccount">
                          Parent Account (Optional)
                        </Label>
                        <Select
                          value={accountForm.parent_id || "none"}
                          onValueChange={(value) =>
                            setAccountForm({
                              ...accountForm,
                              parent_id: value === "none" ? "" : value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent account for hierarchy" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="none">
                              <span className="font-mono text-sm">
                                🏠 No Parent (Top Level)
                              </span>
                            </SelectItem>

                            {/* Hierarchical Account Structure */}
                            {(() => {
                              const hierarchicalAccounts =
                                buildAccountHierarchy(accounts);

                              return (
                                <>
                                  {hierarchicalAccounts.length > 0 && (
                                    <>
                                      <div className="px-2 py-1.5 text-xs font-medium text-gray-500 bg-gray-50">
                                        All Accounts (Hierarchical)
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

                      <div>
                        <Label htmlFor="description">Description</Label>
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
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAccountModalOpen(false)}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Creating..." : "Create Account"}
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

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Notification settings coming soon...
                </p>
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
      </div>
    </DashboardLayout>
  );
}
