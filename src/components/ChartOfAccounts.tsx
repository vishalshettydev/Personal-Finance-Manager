"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import {
  Building2,
  CreditCard,
  TrendingUp,
  Wallet,
  Landmark,
  PiggyBank,
  ChevronDown,
  ChevronRight,
  Expand,
  Minimize2,
  Edit3,
} from "lucide-react";

// Types
interface TreeNode {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  balance?: number;
  type?: string;
  account_type?: string;
  user_id?: string | null;
  is_placeholder?: boolean | null;
  children?: TreeNode[];
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

interface ChartOfAccountsProps {
  showHeader?: boolean;
  className?: string;
  maxHeight?: string;
  refreshTrigger?: number; // Optional prop to trigger refresh
  onEditAccount?: (account: Account) => void; // Optional callback for editing accounts
}

export default function ChartOfAccounts({
  showHeader = true,
  className = "",
  maxHeight = "h-[calc(100vh-300px)] sm:h-[calc(100vh-400px)]",
  refreshTrigger,
  onEditAccount,
}: ChartOfAccountsProps) {
  const { user } = useAuthStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsTree, setAccountsTree] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        .order("name");

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  // Get icon based on account type
  const getAccountIcon = (accountType: string, accountName: string) => {
    const type = accountType.toLowerCase();
    const name = accountName.toLowerCase();

    if (type.includes("bank") || name.includes("bank")) return Landmark;
    if (type.includes("cash") || name.includes("cash")) return Wallet;
    if (type.includes("credit") || name.includes("credit")) return CreditCard;
    if (
      type.includes("investment") ||
      type.includes("stock") ||
      type.includes("mutual")
    )
      return TrendingUp;
    if (type.includes("asset") || name.includes("asset")) return Building2;
    if (type.includes("liability") || name.includes("liability"))
      return CreditCard;
    if (type.includes("equity") || name.includes("equity")) return PiggyBank;
    if (type.includes("income") || name.includes("income")) return TrendingUp;
    if (type.includes("expense") || name.includes("expense")) return Wallet;

    return Building2; // Default icon
  };

  // Build hierarchical tree from flat accounts array
  const buildAccountTree = (accounts: Account[]): TreeNode[] => {
    const accountMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // First pass: create all nodes
    accounts.forEach((account) => {
      const node: TreeNode = {
        id: account.id,
        name: account.name,
        icon: getAccountIcon(account.account_types?.name || "", account.name),
        balance: account.balance || 0,
        type: account.account_types?.name || "Unknown",
        account_type: account.account_types?.category || "Unknown",
        user_id: account.user_id,
        is_placeholder: account.is_placeholder,
        children: [],
      };
      accountMap.set(account.id, node);
    });

    // Second pass: build hierarchy
    accounts.forEach((account) => {
      const node = accountMap.get(account.id);
      if (!node) return;

      if (account.parent_id && accountMap.has(account.parent_id)) {
        const parent = accountMap.get(account.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // Sort nodes at each level
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          sortNodes(node.children);
        }
      });
    };

    sortNodes(rootNodes);
    return rootNodes;
  };

  // Load data
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setIsLoading(true);
        await fetchAccounts();
        setIsLoading(false);
      };
      loadData();
    }
  }, [user, refreshTrigger]); // Add refreshTrigger to dependencies

  // Build tree when accounts change
  useEffect(() => {
    if (accounts.length > 0) {
      const tree = buildAccountTree(accounts);
      setAccountsTree(tree);

      // Start with collapsed state by default
      setExpandedNodes([]);
    }
  }, [accounts]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) =>
      prev.includes(nodeId)
        ? prev.filter((id) => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  // Get all node IDs that have children (can be expanded)
  const getAllExpandableNodeIds = (nodes: TreeNode[]): string[] => {
    const expandableIds: string[] = [];

    const traverse = (nodeList: TreeNode[]) => {
      nodeList.forEach((node) => {
        if (node.children && node.children.length > 0) {
          expandableIds.push(node.id);
          traverse(node.children);
        }
      });
    };

    traverse(nodes);
    return expandableIds;
  };

  const expandAll = () => {
    const allExpandableIds = getAllExpandableNodeIds(accountsTree);
    setExpandedNodes(allExpandableIds);
  };

  const collapseAll = () => {
    setExpandedNodes([]);
  };

  // Helper function to calculate total balance of child accounts
  const getTotalBalance = (node: TreeNode): number => {
    if (!node.children || node.children.length === 0) {
      // For leaf nodes, return their balance (0 if placeholder)
      return node.is_placeholder ? 0 : node.balance || 0;
    }

    // For parent nodes, sum all child balances recursively
    return node.children.reduce(
      (total, child) => total + getTotalBalance(child),
      0
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
    const isSystemAccount = node.user_id === null;

    const indentationStyle = {
      paddingLeft: `${level * 1 + 0.5}rem`,
    };

    return (
      <div key={node.id}>
        <div
          style={indentationStyle}
          className={`group flex items-center w-full p-2 sm:p-3 text-left hover:bg-gray-50 rounded-lg transition-colors cursor-pointer ${
            level > 0 ? "border-l border-gray-200 ml-1 sm:ml-2" : ""
          } min-w-0 ${isSystemAccount ? "bg-blue-50/30" : ""}`}
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
            className={`mr-2 sm:mr-3 flex-shrink-0 ${
              isSystemAccount ? "text-blue-600" : "text-gray-600"
            } ${
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
            <div className="flex items-center gap-2 mt-1">
              {isSystemAccount && (
                <span className="text-xs text-blue-600">System</span>
              )}
              {node.is_placeholder && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                  Placeholder
                </span>
              )}
              {node.type && (
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    isSystemAccount
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {node.type}
                </span>
              )}
            </div>
          </div>

          {node.balance !== undefined &&
            !hasChildren &&
            !node.is_placeholder && (
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

          {hasChildren && (
            <span className="ml-auto text-xs font-medium text-blue-600 flex-shrink-0 min-w-0">
              {formatINR(getTotalBalance(node))}
            </span>
          )}

          {/* Edit button - only show for user accounts and when onEditAccount is provided */}
          {onEditAccount && !isSystemAccount && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Find the original account data
                const account = accounts.find((acc) => acc.id === node.id);
                if (account) {
                  onEditAccount(account);
                }
              }}
              className="ml-2 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200 flex-shrink-0 opacity-0 group-hover:opacity-100"
              title="Edit Account"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
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

  if (isLoading) {
    return (
      <div className={`${className}`}>
        {showHeader && (
          <div className="flex items-center gap-2 mb-4">
            <Landmark className="h-5 w-5" />
            <h2 className="text-xl font-bold text-gray-900">
              Chart of Accounts
            </h2>
          </div>
        )}
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading accounts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            <h2 className="text-xl font-bold text-gray-900">
              Chart of Accounts
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              title="Expand All"
            >
              <Expand className="h-3 w-3" />
              <span className="hidden sm:inline">Expand All</span>
            </button>
            <button
              onClick={collapseAll}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              title="Collapse All"
            >
              <Minimize2 className="h-3 w-3" />
              <span className="hidden sm:inline">Collapse All</span>
            </button>
          </div>
        </div>
      )}

      {/* Controls for when header is hidden */}
      {!showHeader && accountsTree.length > 0 && (
        <div className="flex items-center justify-end gap-2 mb-3">
          <button
            onClick={expandAll}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Expand All"
          >
            <Expand className="h-3 w-3" />
            <span className="hidden sm:inline">Expand All</span>
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Collapse All"
          >
            <Minimize2 className="h-3 w-3" />
            <span className="hidden sm:inline">Collapse All</span>
          </button>
        </div>
      )}

      <div className={`${maxHeight} overflow-y-auto overflow-x-hidden`}>
        {accountsTree.length === 0 ? (
          <div className="text-center py-8">
            <Landmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No accounts found</p>
            <p className="text-sm text-gray-400">
              Create accounts to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {accountsTree.map((node) => (
              <TreeNodeComponent key={node.id} node={node} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
