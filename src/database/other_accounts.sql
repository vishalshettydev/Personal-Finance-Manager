-- Insert sub-account: Bank: HDFC
INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid,
  parent_acc.id,
  type_acc.id,
  'Bank: HDFC',
  false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Bank'
WHERE parent_acc.name = 'Assets' AND parent_acc.is_placeholder = true
LIMIT 1;

-- Insert sub-account: Cash in Hand
INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid,
  parent_acc.id,
  type_acc.id,
  'Cash in Hand',
  false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Cash'
WHERE parent_acc.name = 'Assets' AND parent_acc.is_placeholder = true
LIMIT 1;

-- Insert sub-account: Home Property
INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid,
  parent_acc.id,
  type_acc.id,
  'Home Property',
  false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Asset'
WHERE parent_acc.name = 'Assets' AND parent_acc.is_placeholder = true
LIMIT 1;

-- Insert sub-account: Credit Card
INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid,
  parent_acc.id,
  type_acc.id,
  'Credit Card',
  false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Credit Card'
WHERE parent_acc.name = 'Liabilities' AND parent_acc.is_placeholder = true
LIMIT 1;

-- Insert sub-account: Home Loan
INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid,
  parent_acc.id,
  type_acc.id,
  'Home Loan',
  false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Liability'
WHERE parent_acc.name = 'Liabilities' AND parent_acc.is_placeholder = true
LIMIT 1;

-- Income accounts
INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid, parent_acc.id, type_acc.id, 'Salary', false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Income'
WHERE parent_acc.name = 'Income' AND parent_acc.is_placeholder = true
LIMIT 1;

INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid, parent_acc.id, type_acc.id, 'Freelancing', false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Income'
WHERE parent_acc.name = 'Income' AND parent_acc.is_placeholder = true
LIMIT 1;

INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid, parent_acc.id, type_acc.id, 'Interest (Bank)', false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Income'
WHERE parent_acc.name = 'Income' AND parent_acc.is_placeholder = true
LIMIT 1;

INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid, parent_acc.id, type_acc.id, 'Dividends', false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Income'
WHERE parent_acc.name = 'Income' AND parent_acc.is_placeholder = true
LIMIT 1;

INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid, parent_acc.id, type_acc.id, 'Cashback', false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Income'
WHERE parent_acc.name = 'Income' AND parent_acc.is_placeholder = true
LIMIT 1;

-- Expenses accounts
INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid, parent_acc.id, type_acc.id, 'Rent', false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Expense'
WHERE parent_acc.name = 'Expenses' AND parent_acc.is_placeholder = true
LIMIT 1;

INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid, parent_acc.id, type_acc.id, 'Food', false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Expense'
WHERE parent_acc.name = 'Expenses' AND parent_acc.is_placeholder = true
LIMIT 1;

INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid, parent_acc.id, type_acc.id, 'Insurance', false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Expense'
WHERE parent_acc.name = 'Expenses' AND parent_acc.is_placeholder = true
LIMIT 1;

INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid, parent_acc.id, type_acc.id, 'Utility Bills', false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Expense'
WHERE parent_acc.name = 'Expenses' AND parent_acc.is_placeholder = true
LIMIT 1;

INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid, parent_acc.id, type_acc.id, 'Pharmacy', false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Expense'
WHERE parent_acc.name = 'Expenses' AND parent_acc.is_placeholder = true
LIMIT 1;

INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid, parent_acc.id, type_acc.id, 'Entertainment', false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Expense'
WHERE parent_acc.name = 'Expenses' AND parent_acc.is_placeholder = true
LIMIT 1;

INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid, parent_acc.id, type_acc.id, 'Personal', false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Expense'
WHERE parent_acc.name = 'Expenses' AND parent_acc.is_placeholder = true
LIMIT 1;

INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid, parent_acc.id, type_acc.id, 'Kid Education', false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Expense'
WHERE parent_acc.name = 'Expenses' AND parent_acc.is_placeholder = true
LIMIT 1;

INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid, parent_acc.id, type_acc.id, 'Loan Interest', false
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Expense'
WHERE parent_acc.name = 'Expenses' AND parent_acc.is_placeholder = true
LIMIT 1;

INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid,
  parent_acc.id,
  type_acc.id,
  'Mutual Fund',
  true
FROM public.accounts parent_acc
JOIN public.account_types type_acc ON type_acc.name = 'Mutual Fund'
WHERE parent_acc.name = 'Assets' AND parent_acc.is_placeholder = true
LIMIT 1;


INSERT INTO public.accounts (user_id, parent_id, account_type_id, name, is_placeholder)
SELECT
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid,
  mf_acc.id,
  type_acc.id,
  'Quant ELSS',
  false
FROM public.accounts mf_acc
JOIN public.account_types type_acc ON type_acc.name = 'Mutual Fund'
WHERE mf_acc.name = 'Mutual Fund' AND mf_acc.is_placeholder = true
LIMIT 1;
