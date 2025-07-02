-- Enable required extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================
-- ACCOUNT TYPES
-- ========================
CREATE TABLE public.account_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  category VARCHAR NOT NULL CHECK (category IN ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE', 'SYSTEM')),
  normal_balance VARCHAR NOT NULL CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default account types (based on GnuCash model)
INSERT INTO public.account_types (name, category, normal_balance, description) VALUES
('A/Payable',     'LIABILITY', 'CREDIT', 'Bills to be paid, vendors'),
('A/Receivable',  'ASSET',     'DEBIT',  'Customers who owe you money'),
('Asset',         'ASSET',     'DEBIT',  'Generic asset parent'),
('Bank',          'ASSET',     'DEBIT',  'Bank accounts'),
('Cash',          'ASSET',     'DEBIT',  'Physical cash or wallet'),
('Credit Card',   'LIABILITY', 'CREDIT', 'Credit card liabilities'),
('Equity',        'EQUITY',    'CREDIT', 'Owner’s equity and opening balances'),
('Expense',       'EXPENSE',   'DEBIT',  'All types of expenses'),
('Income',        'INCOME',    'CREDIT', 'Income from all sources'),
('Liability',     'LIABILITY', 'CREDIT', 'General liabilities'),
('Mutual Fund',   'ASSET',     'DEBIT',  'Mutual fund investments'),
('Stock',         'ASSET',     'DEBIT',  'Stock/share investments'),
('Trading',       'SYSTEM',    'DEBIT',  'Currency balancing placeholder');

-- ========================
-- ACCOUNTS (Chart of Accounts)
-- ========================
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  parent_id UUID REFERENCES public.accounts(id),
  account_type_id UUID REFERENCES public.account_types(id),
  name VARCHAR NOT NULL,
  code VARCHAR,
  description TEXT,
  is_placeholder BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  balance NUMERIC(20,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default top-level accounts
WITH top_accounts AS (
  SELECT 'Assets' AS name, 'Asset' AS type_name
  UNION ALL SELECT 'Liabilities', 'Liability'
  UNION ALL SELECT 'Equity', 'Equity'
  UNION ALL SELECT 'Income', 'Income'
  UNION ALL SELECT 'Expenses', 'Expense'
)
INSERT INTO public.accounts (user_id, name, account_type_id, is_placeholder)
SELECT
  NULL::uuid,
  t.name,
  at.id,
  true
FROM top_accounts t
JOIN public.account_types at ON at.name = t.type_name;

-- Insert 'Opening Balance' sub-account under 'Equity'
INSERT INTO public.accounts (
  user_id,
  parent_id,
  account_type_id,
  name,
  is_placeholder
)
SELECT
  NULL::uuid,
  equity_acc.id,
  equity_type.id,
  'Opening Balance',
  false
FROM public.accounts equity_acc
JOIN public.account_types equity_type
  ON equity_acc.account_type_id = equity_type.id
WHERE equity_acc.name = 'Equity'
  AND equity_type.name = 'Equity'
LIMIT 1;

-- ========================
-- TRANSACTIONS (Double Entry System)
-- ========================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  reference_number VARCHAR,
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  total_amount NUMERIC(20,6) NOT NULL,
  notes TEXT,
  is_split BOOLEAN default false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.transaction_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id),
  account_id UUID REFERENCES public.accounts(id),
  entry_side VARCHAR NOT NULL CHECK (entry_side IN ('DEBIT', 'CREDIT')),
  quantity NUMERIC(20,8) DEFAULT 0,
  price NUMERIC(20,8) DEFAULT 0,
  amount NUMERIC(20,6) DEFAULT 0,
  line_number INTEGER,
  description TEXT
);

-- ========================
-- TAGGING SUPPORT
-- ========================
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR NOT NULL,
  color VARCHAR DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.transaction_tags (
  transaction_id UUID REFERENCES public.transactions(id),
  tag_id UUID REFERENCES public.tags(id),
  PRIMARY KEY (transaction_id, tag_id)
);

-- ========================
-- ACCOUNT PRICES (for historical NAV or share price)
-- ========================
CREATE TABLE public.account_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  account_id UUID REFERENCES public.accounts(id),
  price NUMERIC(20,8) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================
-- BUDGETING
-- ========================
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR NOT NULL,
  period_type VARCHAR NOT NULL CHECK (period_type IN ('MONTHLY', 'QUARTERLY', 'YEARLY')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount NUMERIC(20,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES public.budgets(id),
  account_id UUID REFERENCES public.accounts(id),
  allocated_amount NUMERIC(20,6) NOT NULL,
  spent_amount NUMERIC(20,6) DEFAULT 0
);

-- ========================
-- ACCOUNT BALANCE SNAPSHOTS
-- ========================
CREATE TABLE public.account_balance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id),
  balance NUMERIC(20,6) NOT NULL,
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
