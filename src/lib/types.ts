export interface Account {
  id: string;
  user_id: string;
  parent_id?: string;
  account_type_id: string;
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
  balance: number;
  created_at: string;
  updated_at: string;
  children?: Account[];
  account_type?: AccountType;
}

export interface AccountType {
  id: string;
  name: "Assets" | "Liabilities" | "Equity" | "Income" | "Expenses";
  category: "DEBIT" | "CREDIT";
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  reference_number?: string;
  description: string;
  transaction_date: string;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  entries?: TransactionEntry[];
  tags?: Tag[];
}

export interface TransactionEntry {
  id: string;
  transaction_id: string;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  description?: string;
  account?: Account;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  account_id: string;
  investment_type: "MUTUAL_FUND" | "STOCK" | "FD" | "GOLD" | "REAL_ESTATE";
  symbol?: string;
  name: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  purchase_date: string;
  maturity_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  name: string;
  period_type: "MONTHLY" | "QUARTERLY" | "YEARLY";
  start_date: string;
  end_date: string;
  total_amount: number;
  created_at: string;
  categories?: BudgetCategory[];
}

export interface BudgetCategory {
  id: string;
  budget_id: string;
  account_id: string;
  allocated_amount: number;
  spent_amount: number;
  account?: Account;
}
