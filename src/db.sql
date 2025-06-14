-- ACCOUNT TYPES
CREATE TABLE public.account_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  category VARCHAR NOT NULL CHECK (category IN ('DEBIT', 'CREDIT')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ACCOUNTS (Chart of Accounts)
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  parent_id UUID REFERENCES public.accounts(id),
  account_type_id UUID REFERENCES public.account_types(id),
  name VARCHAR NOT NULL,
  code VARCHAR,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TRANSACTIONS (Double Entry)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  reference_number VARCHAR,
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  total_amount NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.transaction_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id),
  account_id UUID REFERENCES public.accounts(id),
  debit_amount NUMERIC DEFAULT 0,
  credit_amount NUMERIC DEFAULT 0,
  description TEXT
);

-- TAGGING SUPPORT
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

-- INVESTMENT MASTER (each investment asset)
CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  account_id UUID REFERENCES public.accounts(id),
  investment_type VARCHAR NOT NULL CHECK (investment_type IN ('MUTUAL_FUND', 'STOCK', 'FD', 'GOLD', 'REAL_ESTATE')),
  symbol VARCHAR,
  name VARCHAR NOT NULL,
  quantity NUMERIC DEFAULT 0,
  purchase_price NUMERIC, -- Average cost per unit
  purchase_date DATE,
  maturity_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- INVESTMENT TRANSACTIONS (SIP, Buy/Sell)
CREATE TABLE public.investment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id UUID REFERENCES public.investments(id),
  transaction_type VARCHAR NOT NULL CHECK (transaction_type IN ('BUY', 'SELL')),
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  fees NUMERIC DEFAULT 0,
  transaction_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INVESTMENT MARKET PRICE HISTORY (NAV or Stock Price)
CREATE TABLE public.investment_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  investment_id UUID REFERENCES public.investments(id),
  symbol VARCHAR NOT NULL,
  price NUMERIC NOT NULL,
  recorded_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- BUDGETING
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR NOT NULL,
  period_type VARCHAR NOT NULL CHECK (period_type IN ('MONTHLY', 'QUARTERLY', 'YEARLY')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES public.budgets(id),
  account_id UUID REFERENCES public.accounts(id),
  allocated_amount NUMERIC NOT NULL,
  spent_amount NUMERIC DEFAULT 0
);

-- ACCOUNT BALANCE SNAPSHOTS (Optional - for fast analytics)
CREATE TABLE public.account_balance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id),
  balance NUMERIC NOT NULL,
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
