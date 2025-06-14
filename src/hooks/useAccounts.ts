import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface AccountType {
  id: string;
  name: string;
  category: string;
}

export interface Account {
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

export interface HierarchicalAccount extends Account {
  level: number;
  isSelectable: boolean;
  hasChildren: boolean;
  children: HierarchicalAccount[];
}

export const useAccounts = (userId: string | null) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch accounts from database
  const fetchAccounts = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

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
        .or(`user_id.eq.${userId},user_id.is.null`)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch accounts"
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Build hierarchical account list with children info
  const buildAccountHierarchy = useCallback(
    (
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
    },
    []
  );

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    buildAccountHierarchy,
    refetch: fetchAccounts,
  };
};
