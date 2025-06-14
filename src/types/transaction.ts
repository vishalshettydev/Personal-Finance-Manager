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
}

export interface TransactionType {
  type: "income" | "expense" | "transfer";
  label: string;
}
