export interface AccountType {
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

export interface TransactionEntry {
  id: string;
  transaction_id: string | null;
  account_id: string | null;
  debit_amount: number | null;
  credit_amount: number | null;
  description: string | null;
  accounts: Account | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export interface TransactionTag {
  tags: Tag;
}

export interface TransactionData {
  id: string;
  user_id: string | null;
  reference_number: string | null;
  description: string;
  transaction_date: string;
  total_amount: number;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  transaction_entries: TransactionEntry[];
  transaction_tags?: TransactionTag[];
}

export type TransactionType = "income" | "expense" | "transfer";

export interface TransactionTypeInfo {
  type: TransactionType;
  label: string;
}

// Database transaction with entries for pagination hook
export interface DatabaseTransactionWithEntries {
  id: string;
  user_id: string | null;
  reference_number: string | null;
  description: string;
  transaction_date: string;
  total_amount: number;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  entries: {
    id: string;
    amount: number;
    is_debit: boolean;
    description: string | null;
    account: {
      id: string;
      name: string;
      type: string;
    } | null;
  }[];
}
