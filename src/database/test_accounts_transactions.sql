-- Using user_id: 6bbc2fe7-5de6-4d82-a402-3ee8251604dc

-- First, let's create the accounts that are referenced in transactions
-- (These would typically be created beforehand through the application)

-- Assets
INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT 
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc',
  assets.id,
  bank_type.id,
  'Bank: HDFC',
  false
FROM public.accounts assets
JOIN public.account_types bank_type ON bank_type.name = 'Bank'
WHERE assets.name = 'Assets' AND assets.user_id IS NULL;

INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT 
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc',
  assets.id,
  cash_type.id,
  'Cash in Hand',
  false
FROM public.accounts assets
JOIN public.account_types cash_type ON cash_type.name = 'Cash'
WHERE assets.name = 'Assets' AND assets.user_id IS NULL;

INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT 
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc',
  assets.id,
  mf_type.id,
  'Quant ELSS',
  false
FROM public.accounts assets
JOIN public.account_types mf_type ON mf_type.name = 'Mutual Fund'
WHERE assets.name = 'Assets' AND assets.user_id IS NULL;

INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT 
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc',
  assets.id,
  asset_type.id,
  'Home Property',
  false
FROM public.accounts assets
JOIN public.account_types asset_type ON asset_type.name = 'Asset'
WHERE assets.name = 'Assets' AND assets.user_id IS NULL;

-- Liabilities
INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT 
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc',
  liabilities.id,
  cc_type.id,
  'Credit Card',
  false
FROM public.accounts liabilities
JOIN public.account_types cc_type ON cc_type.name = 'Credit Card'
WHERE liabilities.name = 'Liabilities' AND liabilities.user_id IS NULL;

INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT 
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc',
  liabilities.id,
  liability_type.id,
  'Home Loan',
  false
FROM public.accounts liabilities
JOIN public.account_types liability_type ON liability_type.name = 'Liability'
WHERE liabilities.name = 'Liabilities' AND liabilities.user_id IS NULL;

-- Income Accounts
INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT 
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc',
  income.id,
  income_type.id,
  account_name,
  false
FROM public.accounts income
JOIN public.account_types income_type ON income_type.name = 'Income'
CROSS JOIN (VALUES 
  ('Salary'),
  ('Freelancing'),
  ('Interest (Bank)'),
  ('Dividends'),
  ('Cashback')
) AS income_accounts(account_name)
WHERE income.name = 'Income' AND income.user_id IS NULL;

-- Expense Accounts
INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT 
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc',
  expenses.id,
  expense_type.id,
  account_name,
  false
FROM public.accounts expenses
JOIN public.account_types expense_type ON expense_type.name = 'Expense'
CROSS JOIN (VALUES 
  ('Rent'),
  ('Food'),
  ('Insurance'),
  ('Utility Bills'),
  ('Pharmacy'),
  ('Entertainment'),
  ('Personal'),
  ('Kid Education'),
  ('Loan Interest')
) AS expense_accounts(account_name)
WHERE expenses.name = 'Expenses' AND expenses.user_id IS NULL;

-- Now let's create the transactions

-- Transaction 1: Opening Balance
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Opening Balance', '2025-06-01', 2000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Opening Balance' THEN 'CREDIT'
    WHEN 'Bank: HDFC' THEN 'DEBIT'
  END,
  2000, 'Opening Balance'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Opening Balance', 'Bank: HDFC')
  AND acc.user_id IN ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', NULL);

-- Transaction 2: Salary Credited
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Salary Credited', '2025-06-02', 32000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Salary' THEN 'CREDIT'
    WHEN 'Bank: HDFC' THEN 'DEBIT'
  END,
  32000, 'Salary Credited'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Salary', 'Bank: HDFC')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Transaction 3: Paid Rent
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Paid Rent', '2025-06-03', 5000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Rent' THEN 'DEBIT'
    WHEN 'Bank: HDFC' THEN 'CREDIT'
  END,
  5000, 'Paid Rent'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Rent', 'Bank: HDFC')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Transaction 4: Food Delivery
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Food Delivery', '2025-06-04', 1000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Food' THEN 'DEBIT'
    WHEN 'Bank: HDFC' THEN 'CREDIT'
  END,
  1000, 'Food Delivery'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Food', 'Bank: HDFC')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Transaction 5: Credit Card Spend
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Credit Card Spend', '2025-06-05', 500)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Food' THEN 'DEBIT'
    WHEN 'Credit Card' THEN 'CREDIT'
  END,
  500, 'Credit Card Spend'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Food', 'Credit Card')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Transaction 6: Freelancing Payment
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Freelancing Payment', '2025-06-06', 2500)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Freelancing' THEN 'CREDIT'
    WHEN 'Cash in Hand' THEN 'DEBIT'
  END,
  2500, 'Freelancing Payment'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Freelancing', 'Cash in Hand')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Transaction 7: Insurance Premium
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Insurance Premium', '2025-06-07', 2000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Insurance' THEN 'DEBIT'
    WHEN 'Bank: HDFC' THEN 'CREDIT'
  END,
  2000, 'Insurance Premium'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Insurance', 'Bank: HDFC')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Transaction 8: Paid Utility Bill
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Paid Utility Bill', '2025-06-08', 800)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Utility Bills' THEN 'DEBIT'
    WHEN 'Bank: HDFC' THEN 'CREDIT'
  END,
  800, 'Paid Utility Bill'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Utility Bills', 'Bank: HDFC')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Transaction 9: Bought Medicines
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Bought Medicines', '2025-06-09', 450)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Pharmacy' THEN 'DEBIT'
    WHEN 'Bank: HDFC' THEN 'CREDIT'
  END,
  450, 'Bought Medicines'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Pharmacy', 'Bank: HDFC')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Transaction 10: Movie + Snacks
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Movie + Snacks', '2025-06-10', 400)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Entertainment' THEN 'DEBIT'
    WHEN 'Bank: HDFC' THEN 'CREDIT'
  END,
  400, 'Movie + Snacks'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Entertainment', 'Bank: HDFC')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Transaction 11: Personal Shopping
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Personal Shopping', '2025-06-11', 800)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Personal' THEN 'DEBIT'
    WHEN 'Bank: HDFC' THEN 'CREDIT'
  END,
  800, 'Personal Shopping'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Personal', 'Bank: HDFC')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Transaction 12: Kid's School Fees
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Kids School Fees', '2025-06-12', 3000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Kid Education' THEN 'DEBIT'
    WHEN 'Bank: HDFC' THEN 'CREDIT'
  END,
  3000, 'Kids School Fees'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Kid Education', 'Bank: HDFC')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Transaction 13: Bank Interest Received
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Bank Interest Received', '2025-06-13', 150)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Interest (Bank)' THEN 'CREDIT'
    WHEN 'Bank: HDFC' THEN 'DEBIT'
  END,
  150, 'Bank Interest Received'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Interest (Bank)', 'Bank: HDFC')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Transaction 14: Dividend Received
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Dividend Received', '2025-06-14', 200)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Dividends' THEN 'CREDIT'
    WHEN 'Bank: HDFC' THEN 'DEBIT'
  END,
  200, 'Dividend Received'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Dividends', 'Bank: HDFC')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Transaction 15: Cashback from UPI
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Cashback from UPI', '2025-06-15', 100)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Cashback' THEN 'CREDIT'
    WHEN 'Bank: HDFC' THEN 'DEBIT'
  END,
  100, 'Cashback from UPI'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Cashback', 'Bank: HDFC')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Transaction 16: Home Loan Sanctioned
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Home Loan Sanctioned', '2025-06-16', 500000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Home Loan' THEN 'CREDIT'
    WHEN 'Home Property' THEN 'DEBIT'
  END,
  500000, 'Home Loan Sanctioned'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Home Loan', 'Home Property')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Transaction 17: EMI Payment - Principal
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'EMI Payment (Principal)', '2025-06-17', 18000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Home Loan' THEN 'DEBIT'
    WHEN 'Bank: HDFC' THEN 'CREDIT'
  END,
  18000, 'EMI Payment (Principal)'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Home Loan', 'Bank: HDFC')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Transaction 18: EMI Payment - Interest
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'EMI Payment (Interest)', '2025-06-17', 2000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Loan Interest' THEN 'DEBIT'
    WHEN 'Bank: HDFC' THEN 'CREDIT'
  END,
  2000, 'EMI Payment (Interest)'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Loan Interest', 'Bank: HDFC')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- MUTUAL FUND TRANSACTIONS WITH PRICING

-- Insert NAV for 2025-06-18
INSERT INTO public.account_prices (user_id, account_id, price, date)
SELECT
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc',
  acc.id,
  200,
  '2025-06-18'
FROM public.accounts acc
WHERE acc.name = 'Quant ELSS'
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Buy 10 units @200
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Buy 10 Quant ELSS @200', '2025-06-18', 2000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, quantity, price, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Quant ELSS' THEN 'DEBIT'
    WHEN 'Bank: HDFC' THEN 'CREDIT'
  END,
  CASE acc.name WHEN 'Quant ELSS' THEN 10 ELSE 0 END,
  CASE acc.name WHEN 'Quant ELSS' THEN 200 ELSE 0 END,
  2000,
  'Buy 10 units @200'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Quant ELSS', 'Bank: HDFC')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Insert NAV for 2025-06-19
INSERT INTO public.account_prices (user_id, account_id, price, date)
SELECT
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc',
  acc.id,
  210,
  '2025-06-19'
FROM public.accounts acc
WHERE acc.name = 'Quant ELSS'
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Buy 5 units @210
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Buy 5 Quant ELSS @210', '2025-06-19', 1050)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, quantity, price, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Quant ELSS' THEN 'DEBIT'
    WHEN 'Bank: HDFC' THEN 'CREDIT'
  END,
  CASE acc.name WHEN 'Quant ELSS' THEN 5 ELSE 0 END,
  CASE acc.name WHEN 'Quant ELSS' THEN 210 ELSE 0 END,
  1050,
  'Buy 5 units @210'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Quant ELSS', 'Bank: HDFC')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Insert NAV for 2025-06-20
INSERT INTO public.account_prices (user_id, account_id, price, date)
SELECT
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc',
  acc.id,
  220,
  '2025-06-20'
FROM public.accounts acc
WHERE acc.name = 'Quant ELSS'
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';

-- Sell 10 units @220
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Sell 10 Quant ELSS @220', '2025-06-20', 2200)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, quantity, price, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Quant ELSS' THEN 'CREDIT'
    WHEN 'Bank: HDFC' THEN 'DEBIT'
  END,
  CASE acc.name WHEN 'Quant ELSS' THEN 10 ELSE 0 END,
  CASE acc.name WHEN 'Quant ELSS' THEN 220 ELSE 0 END,
  2200,
  'Sell 10 units @220'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Quant ELSS', 'Bank: HDFC')
  AND acc.user_id = '6bbc2fe7-5de6-4d82-a402-3ee8251604dc';