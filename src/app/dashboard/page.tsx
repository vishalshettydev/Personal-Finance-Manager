"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Building2,
  CreditCard,
  LineChart,
  Receipt,
  Landmark,
  ChevronDown,
  ChevronRight,
  Banknote,
  Building,
  Smartphone,
  Home,
  Car,
  Briefcase,
  AlertCircle,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Types for nested tree structure
interface TreeNode {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  balance?: number;
  type?: string;
  children?: TreeNode[];
}

export default function Dashboard() {
  const { user, loading, initialize } = useAuthStore();
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<string[]>([
    "banking",
    "banking.hdfc",
    "investments",
    "investments.stocks",
  ]);

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    type: "",
    amount: "",
    category: "",
    account: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

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
      paddingLeft: `${level * 1.5 + 0.5}rem`,
    };

    return (
      <div key={node.id}>
        <div
          style={indentationStyle}
          className={`flex items-center w-full p-2 text-left hover:bg-gray-50 rounded-lg transition-colors cursor-pointer ${
            level > 0 ? "border-l border-gray-200 ml-2" : ""
          }`}
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
            className={`h-4 w-4 mr-3 text-gray-600 flex-shrink-0 ${
              level === 0 ? "h-5 w-5" : level === 1 ? "h-4 w-4" : "h-3 w-3"
            }`}
          />

          <div className="flex-1 min-w-0">
            <span
              className={`font-medium text-gray-900 ${
                level === 0 ? "text-base" : level === 1 ? "text-sm" : "text-xs"
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
              className={`font-semibold flex-shrink-0 ml-2 ${
                level === 0 ? "text-sm" : "text-xs"
              } ${node.balance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatINR(Math.abs(node.balance))}
            </span>
          )}

          {hasChildren && !node.balance && (
            <span className="ml-auto text-xs text-gray-500 flex-shrink-0">
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

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Transaction submitted:", transactionForm);
    setIsTransactionModalOpen(false);
    setTransactionForm({
      type: "",
      amount: "",
      category: "",
      account: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  // Enhanced nested accounts data structure (this would come from database)
  const accountsTreeData: TreeNode[] = [
    {
      id: "banking",
      name: "Banking",
      icon: Building,
      type: "category",
      children: [
        {
          id: "banking.hdfc",
          name: "HDFC Bank",
          icon: Building2,
          type: "subcategory",
          children: [
            {
              id: "banking.hdfc.savings",
              name: "Primary Savings",
              icon: Wallet,
              balance: 245000,
              type: "savings",
            },
            {
              id: "banking.hdfc.current",
              name: "Business Current",
              icon: Briefcase,
              balance: 180000,
              type: "current",
            },
            {
              id: "banking.hdfc.fd",
              name: "Fixed Deposits",
              icon: PiggyBank,
              type: "subcategory",
              children: [
                {
                  id: "banking.hdfc.fd.1year",
                  name: "1 Year FD",
                  icon: PiggyBank,
                  balance: 500000,
                  type: "fixed_deposit",
                },
                {
                  id: "banking.hdfc.fd.3year",
                  name: "3 Year FD",
                  icon: PiggyBank,
                  balance: 300000,
                  type: "fixed_deposit",
                },
              ],
            },
          ],
        },
        {
          id: "banking.icici",
          name: "ICICI Bank",
          icon: Building2,
          type: "subcategory",
          children: [
            {
              id: "banking.icici.salary",
              name: "Salary Account",
              icon: Wallet,
              balance: 85000,
              type: "savings",
            },
            {
              id: "banking.icici.nri",
              name: "NRI Account",
              icon: Wallet,
              balance: 150000,
              type: "nri",
            },
          ],
        },
        {
          id: "banking.sbi",
          name: "SBI",
          icon: Building2,
          type: "subcategory",
          children: [
            {
              id: "banking.sbi.joint",
              name: "Joint Account",
              icon: Wallet,
              balance: 75000,
              type: "savings",
            },
          ],
        },
      ],
    },
    {
      id: "credit",
      name: "Credit Cards",
      icon: CreditCard,
      type: "category",
      children: [
        {
          id: "credit.hdfc",
          name: "HDFC Cards",
          icon: CreditCard,
          type: "subcategory",
          children: [
            {
              id: "credit.hdfc.regalia",
              name: "Regalia Credit Card",
              icon: CreditCard,
              balance: -25000,
              type: "credit",
            },
            {
              id: "credit.hdfc.millenia",
              name: "Millenia Credit Card",
              icon: CreditCard,
              balance: -8500,
              type: "credit",
            },
          ],
        },
        {
          id: "credit.icici",
          name: "ICICI Cards",
          icon: CreditCard,
          type: "subcategory",
          children: [
            {
              id: "credit.icici.amazon",
              name: "Amazon Pay Card",
              icon: CreditCard,
              balance: -12000,
              type: "credit",
            },
          ],
        },
      ],
    },
    {
      id: "investments",
      name: "Investments",
      icon: LineChart,
      type: "category",
      children: [
        {
          id: "investments.stocks",
          name: "Stock Market",
          icon: TrendingUp,
          type: "subcategory",
          children: [
            {
              id: "investments.stocks.zerodha",
              name: "Zerodha Demat",
              icon: LineChart,
              type: "subcategory",
              children: [
                {
                  id: "investments.stocks.zerodha.equity",
                  name: "Equity Portfolio",
                  icon: TrendingUp,
                  balance: 350000,
                  type: "equity",
                },
                {
                  id: "investments.stocks.zerodha.intraday",
                  name: "Intraday Trading",
                  icon: TrendingUp,
                  balance: 50000,
                  type: "trading",
                },
              ],
            },
            {
              id: "investments.stocks.groww",
              name: "Groww Account",
              icon: LineChart,
              balance: 100000,
              type: "equity",
            },
          ],
        },
        {
          id: "investments.mf",
          name: "Mutual Funds",
          icon: PiggyBank,
          type: "subcategory",
          children: [
            {
              id: "investments.mf.equity",
              name: "Equity Funds",
              icon: TrendingUp,
              balance: 200000,
              type: "mutual_fund",
            },
            {
              id: "investments.mf.debt",
              name: "Debt Funds",
              icon: PiggyBank,
              balance: 125000,
              type: "mutual_fund",
            },
            {
              id: "investments.mf.hybrid",
              name: "Hybrid Funds",
              icon: LineChart,
              balance: 75000,
              type: "mutual_fund",
            },
          ],
        },
      ],
    },
    {
      id: "assets",
      name: "Physical Assets",
      icon: Home,
      type: "category",
      children: [
        {
          id: "assets.property",
          name: "Real Estate",
          icon: Home,
          type: "subcategory",
          children: [
            {
              id: "assets.property.home",
              name: "Primary Residence",
              icon: Home,
              balance: 5000000,
              type: "property",
            },
            {
              id: "assets.property.plot",
              name: "Land Investment",
              icon: Home,
              balance: 2000000,
              type: "property",
            },
          ],
        },
        {
          id: "assets.vehicles",
          name: "Vehicles",
          icon: Car,
          type: "subcategory",
          children: [
            {
              id: "assets.vehicles.car",
              name: "Honda City",
              icon: Car,
              balance: 800000,
              type: "vehicle",
            },
            {
              id: "assets.vehicles.bike",
              name: "Royal Enfield",
              icon: Car,
              balance: 150000,
              type: "vehicle",
            },
          ],
        },
      ],
    },
    {
      id: "cash",
      name: "Cash & Digital",
      icon: Banknote,
      type: "category",
      children: [
        {
          id: "cash.physical",
          name: "Physical Cash",
          icon: Banknote,
          balance: 15000,
          type: "cash",
        },
        {
          id: "cash.digital",
          name: "Digital Wallets",
          icon: Smartphone,
          type: "subcategory",
          children: [
            {
              id: "cash.digital.paytm",
              name: "Paytm Wallet",
              icon: Smartphone,
              balance: 2500,
              type: "digital_wallet",
            },
            {
              id: "cash.digital.phonepe",
              name: "PhonePe Wallet",
              icon: Smartphone,
              balance: 1800,
              type: "digital_wallet",
            },
            {
              id: "cash.digital.gpay",
              name: "Google Pay",
              icon: Smartphone,
              balance: 700,
              type: "digital_wallet",
            },
          ],
        },
      ],
    },
  ];

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
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                  <DialogDescription>
                    Record a new income or expense transaction using
                    double-entry accounting.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleTransactionSubmit} className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-blue-600 mr-2" />
                      <p className="text-sm text-blue-700">
                        This uses double-entry accounting. Each transaction
                        affects at least two accounts.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={transactionForm.type}
                        onValueChange={(value) =>
                          setTransactionForm({
                            ...transactionForm,
                            type: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0"
                        value={transactionForm.amount}
                        onChange={(e) =>
                          setTransactionForm({
                            ...transactionForm,
                            amount: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={transactionForm.category}
                      onValueChange={(value) =>
                        setTransactionForm({
                          ...transactionForm,
                          category: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="food">Food & Dining</SelectItem>
                        <SelectItem value="transport">
                          Transportation
                        </SelectItem>
                        <SelectItem value="shopping">Shopping</SelectItem>
                        <SelectItem value="entertainment">
                          Entertainment
                        </SelectItem>
                        <SelectItem value="bills">Bills & Utilities</SelectItem>
                        <SelectItem value="salary">Salary</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="account">Account</Label>
                    <Select
                      value={transactionForm.account}
                      onValueChange={(value) =>
                        setTransactionForm({
                          ...transactionForm,
                          account: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="savings">Savings Account</SelectItem>
                        <SelectItem value="current">Current Account</SelectItem>
                        <SelectItem value="credit">Credit Card</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={transactionForm.date}
                      onChange={(e) =>
                        setTransactionForm({
                          ...transactionForm,
                          date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Transaction description..."
                      value={transactionForm.description}
                      onChange={(e) =>
                        setTransactionForm({
                          ...transactionForm,
                          description: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsTransactionModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Transaction</Button>
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
            <div className="bg-white rounded-lg shadow max-h-[600px] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
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
                {accountsTreeData.length === 0 ? (
                  <div className="text-center py-8">
                    <Landmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
                      No accounts created yet
                    </p>
                    <p className="text-sm text-gray-400">
                      Go to Settings → Accounts to create your first account
                    </p>
                  </div>
                ) : (
                  accountsTreeData.map((node) => (
                    <TreeNodeComponent key={node.id} node={node} level={0} />
                  ))
                )}
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
