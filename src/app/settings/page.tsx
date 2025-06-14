"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
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
  Building2,
  CreditCard,
  TrendingUp,
  Wallet,
  Landmark,
  PiggyBank,
  ChevronDown,
  ChevronRight,
  Plus,
  User,
  Bell,
  Shield,
  Palette,
} from "lucide-react";

// Types
interface TreeNode {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  balance?: number;
  type?: string;
  children?: TreeNode[];
}

interface AccountType {
  id: string;
  name: string;
  category: "DEBIT" | "CREDIT";
}

export default function Settings() {
  const { user, loading, initialize } = useAuthStore();
  const router = useRouter();

  // State for account management
  const [expandedNodes, setExpandedNodes] = useState<string[]>([
    "banking",
    "investments",
    "cash",
  ]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Account form state - Updated to match database schema
  const [accountForm, setAccountForm] = useState({
    name: "",
    code: "",
    account_type_id: "",
    parent_id: "none",
    description: "",
    initial_balance: "0",
  });

  // Mock account types (these would come from the database)
  const accountTypes: AccountType[] = [
    { id: "1", name: "Bank Account", category: "DEBIT" },
    { id: "2", name: "Cash", category: "DEBIT" },
    { id: "3", name: "Credit Card", category: "CREDIT" },
    { id: "4", name: "Investment Account", category: "DEBIT" },
    { id: "5", name: "Fixed Deposit", category: "DEBIT" },
    { id: "6", name: "Mutual Fund", category: "DEBIT" },
    { id: "7", name: "Stock Portfolio", category: "DEBIT" },
    { id: "8", name: "Real Estate", category: "DEBIT" },
    { id: "9", name: "Vehicle", category: "DEBIT" },
    { id: "10", name: "Loan", category: "CREDIT" },
    { id: "11", name: "Digital Wallet", category: "DEBIT" },
  ];

  // Mock account tree data (this would come from the database)
  const accountsTree: TreeNode[] = [
    {
      id: "banking",
      name: "Banking",
      icon: Building2,
      children: [
        {
          id: "hdfc",
          name: "HDFC Bank",
          icon: Landmark,
          children: [
            {
              id: "hdfc-savings",
              name: "Savings Account",
              icon: PiggyBank,
              balance: 245000,
              type: "account",
            },
            {
              id: "hdfc-current",
              name: "Current Account",
              icon: Building2,
              balance: 180000,
              type: "account",
            },
            {
              id: "hdfc-fd",
              name: "Fixed Deposits",
              icon: TrendingUp,
              children: [
                {
                  id: "hdfc-fd-1yr",
                  name: "1 Year FD",
                  icon: TrendingUp,
                  balance: 500000,
                  type: "account",
                },
                {
                  id: "hdfc-fd-3yr",
                  name: "3 Year FD",
                  icon: TrendingUp,
                  balance: 300000,
                  type: "account",
                },
              ],
            },
          ],
        },
        {
          id: "sbi",
          name: "State Bank of India",
          icon: Landmark,
          children: [
            {
              id: "sbi-savings",
              name: "Savings Account",
              icon: PiggyBank,
              balance: 125000,
              type: "account",
            },
          ],
        },
      ],
    },
    {
      id: "credit-cards",
      name: "Credit Cards",
      icon: CreditCard,
      children: [
        {
          id: "hdfc-cc",
          name: "HDFC Regalia",
          icon: CreditCard,
          balance: -45000,
          type: "account",
        },
        {
          id: "sbi-cc",
          name: "SBI SimplyCLICK",
          icon: CreditCard,
          balance: -28000,
          type: "account",
        },
      ],
    },
    {
      id: "investments",
      name: "Investments",
      icon: TrendingUp,
      children: [
        {
          id: "stock-market",
          name: "Stock Market",
          icon: TrendingUp,
          children: [
            {
              id: "zerodha",
              name: "Zerodha Demat",
              icon: TrendingUp,
              children: [
                {
                  id: "zerodha-equity",
                  name: "Equity Portfolio",
                  icon: TrendingUp,
                  balance: 450000,
                  type: "account",
                },
                {
                  id: "zerodha-intraday",
                  name: "Intraday Trading",
                  icon: TrendingUp,
                  balance: 25000,
                  type: "account",
                },
              ],
            },
          ],
        },
        {
          id: "mutual-funds",
          name: "Mutual Funds",
          icon: PiggyBank,
          children: [
            {
              id: "sip-equity",
              name: "Equity SIP",
              icon: TrendingUp,
              balance: 325000,
              type: "account",
            },
            {
              id: "sip-debt",
              name: "Debt SIP",
              icon: PiggyBank,
              balance: 150000,
              type: "account",
            },
          ],
        },
      ],
    },
    {
      id: "cash",
      name: "Cash & Others",
      icon: Wallet,
      children: [
        {
          id: "cash-wallet",
          name: "Physical Cash",
          icon: Wallet,
          balance: 15000,
          type: "account",
        },
        {
          id: "paytm",
          name: "Paytm Wallet",
          icon: Wallet,
          balance: 2500,
          type: "account",
        },
        {
          id: "gpay",
          name: "Google Pay",
          icon: Wallet,
          balance: 1200,
          type: "account",
        },
      ],
    },
  ];

  useEffect(() => {
    if (!user && loading) {
      initialize();
    }
  }, [user, loading, initialize]);

  // Function to format currency in Indian Rupees
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) =>
      prev.includes(nodeId)
        ? prev.filter((id) => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  // Recursive tree component
  const TreeNodeComponent = ({
    node,
    level = 0,
  }: {
    node: TreeNode;
    level?: number;
  }) => {
    const isExpanded = expandedNodes.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const Icon = node.icon;

    const indentationStyle = {
      paddingLeft: `${level * 1 + 0.5}rem`,
    };

    return (
      <div key={node.id}>
        <div
          style={indentationStyle}
          className={`flex items-center w-full p-2 sm:p-3 text-left hover:bg-gray-50 rounded-lg transition-colors cursor-pointer ${
            level > 0 ? "border-l border-gray-200 ml-1 sm:ml-2" : ""
          } min-w-0`}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
            )
          ) : (
            <div className="w-4 h-4 mr-2"></div>
          )}

          <Icon
            className={`mr-2 sm:mr-3 text-gray-600 flex-shrink-0 ${
              level === 0
                ? "h-4 w-4 sm:h-5 sm:w-5"
                : level === 1
                ? "h-3 w-3 sm:h-4 sm:w-4"
                : "h-3 w-3"
            }`}
          />

          <div className="flex-1 min-w-0">
            <span
              className={`font-medium text-gray-900 ${
                level === 0
                  ? "text-sm sm:text-base"
                  : level === 1
                  ? "text-xs sm:text-sm"
                  : "text-xs"
              }`}
            >
              {node.name}
            </span>
            {node.type && level > 1 && (
              <p className="text-xs text-gray-500 capitalize truncate">
                {node.type}
              </p>
            )}
          </div>

          {node.balance !== undefined && (
            <span
              className={`font-semibold flex-shrink-0 ml-1 sm:ml-2 text-right ${
                level === 0 ? "text-xs sm:text-sm" : "text-xs"
              } ${
                node.balance >= 0 ? "text-green-600" : "text-red-600"
              } min-w-0 truncate max-w-[80px] sm:max-w-none`}
            >
              {formatINR(Math.abs(node.balance))}
            </span>
          )}

          {hasChildren && !node.balance && (
            <span className="ml-auto text-xs text-gray-500 flex-shrink-0 min-w-0">
              ({getTotalAccounts(node)})
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className={level === 0 ? "mt-1 mb-3" : "mt-1"}>
            {node.children!.map((child) => (
              <TreeNodeComponent
                key={child.id}
                node={child}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Helper function to count total accounts in a tree
  const getTotalAccounts = (node: TreeNode): number => {
    if (!node.children) return node.type === "account" ? 1 : 0;
    return node.children.reduce(
      (total, child) => total + getTotalAccounts(child),
      0
    );
  };

  // Get flat list of accounts for parent selection
  const getFlatAccountsList = (
    nodes: TreeNode[],
    prefix = ""
  ): Array<{ id: string; name: string; level: number }> => {
    const result: Array<{ id: string; name: string; level: number }> = [];

    nodes.forEach((node) => {
      const currentName = prefix ? `${prefix} > ${node.name}` : node.name;
      const level = prefix.split(" > ").length - 1;

      result.push({
        id: node.id,
        name: currentName,
        level,
      });

      if (node.children) {
        result.push(...getFlatAccountsList(node.children, currentName));
      }
    });

    return result;
  };

  const flatAccountsList = getFlatAccountsList(accountsTree);

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Account submitted:", accountForm);
    // TODO: Add API call to create account in database
    setIsAccountModalOpen(false);
    setAccountForm({
      name: "",
      code: "",
      account_type_id: "",
      parent_id: "none",
      description: "",
      initial_balance: "0",
    });
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
                          value={accountForm.parent_id}
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
                          <SelectContent>
                            <SelectItem value="none">
                              No Parent (Top Level)
                            </SelectItem>
                            {flatAccountsList.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {"  ".repeat(account.level)}└ {account.name}
                              </SelectItem>
                            ))}
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
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Create Account</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="h-[calc(100vh-300px)] sm:h-[calc(100vh-400px)] overflow-y-auto overflow-x-hidden">
                  {accountsTree.map((node) => (
                    <TreeNodeComponent key={node.id} node={node} />
                  ))}
                </div>
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
