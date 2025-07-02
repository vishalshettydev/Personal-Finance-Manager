-- Using user_id: 6bbc2fe7-5de6-4d82-a402-3ee8251604dc

-- Transaction 1: Opening Balance
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Opening Balance', '2025-06-01', 2000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Opening Balance' THEN 'DEBIT'
    WHEN 'Bank: HDFC' THEN 'CREDIT'
  END,
  2000, 'Opening Balance'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Opening Balance', 'Bank: HDFC');

-- Transaction 2: Salary Credited
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Salary Credited', '2025-06-02', 32000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Salary' THEN 'DEBIT'
    WHEN 'Bank: HDFC' THEN 'CREDIT'
  END,
  32000, 'Salary Credited'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Salary', 'Bank: HDFC');

-- Transaction 3: Paid Rent
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Paid Rent', '2025-06-03', 5000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Rent' THEN 'CREDIT'
    WHEN 'Bank: HDFC' THEN 'DEBIT'
  END,
  5000, 'Paid Rent'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Rent', 'Bank: HDFC');

-- Transaction 4: Food Delivery
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Food Delivery', '2025-06-04', 1000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Food' THEN 'CREDIT'::entry_side_enum
    WHEN 'Bank: HDFC' THEN 'DEBIT'::entry_side_enum
  END,
  1000, 'Food Delivery'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Food', 'Bank: HDFC');

-- Transaction 5: Credit Card Spend
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Credit Card Spend', '2025-06-05', 500)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Food' THEN 'CREDIT'::entry_side_enum
    WHEN 'Credit Card' THEN 'DEBIT'::entry_side_enum
  END,
  500, 'Credit Card Spend'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Food', 'Credit Card');

-- Transaction 6: Freelancing Payment
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Freelancing Payment', '2025-06-06', 2500)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Freelancing' THEN 'DEBIT'::entry_side_enum
    WHEN 'Cash in Hand' THEN 'CREDIT'::entry_side_enum
  END,
  2500, 'Freelancing Payment'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Freelancing', 'Cash in Hand');

-- Transaction 7: Insurance Premium
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Insurance Premium', '2025-06-07', 2000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Insurance' THEN 'CREDIT'::entry_side_enum
    WHEN 'Bank: HDFC' THEN 'DEBIT'::entry_side_enum
  END,
  2000, 'Insurance Premium'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Insurance', 'Bank: HDFC');

-- Transaction 8: Paid Utility Bill
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Paid Utility Bill', '2025-06-08', 800)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Utility Bills' THEN 'CREDIT'::entry_side_enum
    WHEN 'Bank: HDFC' THEN 'DEBIT'::entry_side_enum
  END,
  800, 'Paid Utility Bill'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Utility Bills', 'Bank: HDFC');

-- Transaction 9: Bought Medicines
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Bought Medicines', '2025-06-09', 450)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Pharmacy' THEN 'CREDIT'::entry_side_enum
    WHEN 'Bank: HDFC' THEN 'DEBIT'::entry_side_enum
  END,
  450, 'Bought Medicines'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Pharmacy', 'Bank: HDFC');

-- Transaction 10: Movie + Snacks
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Movie + Snacks', '2025-06-10', 400)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Entertainment' THEN 'CREDIT'::entry_side_enum
    WHEN 'Bank: HDFC' THEN 'DEBIT'::entry_side_enum
  END,
  400, 'Movie + Snacks'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Entertainment', 'Bank: HDFC');

-- Transaction 11: Personal Shopping
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Personal Shopping', '2025-06-11', 800)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Personal' THEN 'CREDIT'::entry_side_enum
    WHEN 'Bank: HDFC' THEN 'DEBIT'::entry_side_enum
  END,
  800, 'Personal Shopping'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Personal', 'Bank: HDFC');

-- Transaction 12: Kid's School Fees
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Kids School Fees', '2025-06-12', 3000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Kid Education' THEN 'CREDIT'::entry_side_enum
    WHEN 'Bank: HDFC' THEN 'DEBIT'::entry_side_enum
  END,
  3000, 'Kids School Fees'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Kid Education', 'Bank: HDFC');

-- Transaction 13: Bank Interest Received
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Bank Interest Received', '2025-06-13', 150)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Interest (Bank)' THEN 'DEBIT'::entry_side_enum
    WHEN 'Bank: HDFC' THEN 'CREDIT'::entry_side_enum
  END,
  150, 'Bank Interest Received'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Interest (Bank)', 'Bank: HDFC');

-- Transaction 14: Dividend Received
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Dividend Received', '2025-06-14', 200)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Dividends' THEN 'DEBIT'::entry_side_enum
    WHEN 'Bank: HDFC' THEN 'CREDIT'::entry_side_enum
  END,
  200, 'Dividend Received'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Dividends', 'Bank: HDFC');

-- Transaction 15: Cashback from UPI
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Cashback from UPI', '2025-06-15', 100)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Cashback' THEN 'DEBIT'::entry_side_enum
    WHEN 'Bank: HDFC' THEN 'CREDIT'::entry_side_enum
  END,
  100, 'Cashback from UPI'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Cashback', 'Bank: HDFC');

-- Transaction 16: Home Loan Sanctioned
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Home Loan Sanctioned', '2025-06-16', 500000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Home Loan' THEN 'DEBIT'::entry_side_enum
    WHEN 'Home Property' THEN 'CREDIT'::entry_side_enum
  END,
  500000, 'Home Loan Sanctioned'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Home Loan', 'Home Property');

-- Transaction 17: EMI Payment - Principal
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'EMI Payment (Principal)', '2025-06-17', 18000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Bank: HDFC' THEN 'DEBIT'::entry_side_enum
    WHEN 'Home Loan' THEN 'CREDIT'::entry_side_enum
  END,
  18000, 'EMI Payment (Principal)'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Home Loan', 'Bank: HDFC');

-- Transaction 18: EMI Payment - Interest
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'EMI Payment (Interest)', '2025-06-17', 2000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, entry_side, amount, description)
SELECT nt.id, acc.id,
  CASE acc.name
    WHEN 'Bank: HDFC' THEN 'DEBIT'::entry_side_enum
    WHEN 'Loan Interest' THEN 'CREDIT'::entry_side_enum
  END,
  2000, 'EMI Payment (Interest)'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Loan Interest', 'Bank: HDFC');


-- Insert NAV for 2025-06-18
INSERT INTO public.account_prices (user_id, account_id, price, date)
SELECT
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc',
  acc.id,
  200,
  '2025-06-18'
FROM public.accounts acc
WHERE acc.name = 'Quant ELSS';

-- Buy 10 units @200
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Buy 10 Quant ELSS @200', '2025-06-18', 2000)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, quantity, price, amount, entry_side, description)
SELECT nt.id, acc.id,
  CASE acc.name WHEN 'Quant ELSS' THEN 10 ELSE NULL END,
  CASE acc.name WHEN 'Quant ELSS' THEN 200 ELSE NULL END,
  2000,
  CASE acc.name
    WHEN 'Quant ELSS' THEN 'BUY'
    WHEN 'Bank: HDFC' THEN 'CREDIT'
  END::entry_side_enum,
  'Buy 10 units @200'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Quant ELSS', 'Bank: HDFC');

-- Insert NAV for 2025-06-19
INSERT INTO public.account_prices (user_id, account_id, price, date)
SELECT
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc',
  acc.id,
  210,
  '2025-06-19'
FROM public.accounts acc
WHERE acc.name = 'Quant ELSS';

-- Buy 5 units @210
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Buy 5 Quant ELSS @210', '2025-06-19', 1050)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, quantity, price, amount, entry_side, description)
SELECT nt.id, acc.id,
  CASE acc.name WHEN 'Quant ELSS' THEN 5 ELSE NULL END,
  CASE acc.name WHEN 'Quant ELSS' THEN 210 ELSE NULL END,
  1050,
  CASE acc.name
    WHEN 'Quant ELSS' THEN 'BUY'
    WHEN 'Bank: HDFC' THEN 'CREDIT'
  END::entry_side_enum,
  'Buy 5 units @210'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Quant ELSS', 'Bank: HDFC');

-- Insert NAV for 2025-06-20
INSERT INTO public.account_prices (user_id, account_id, price, date)
SELECT
  '6bbc2fe7-5de6-4d82-a402-3ee8251604dc',
  acc.id,
  220,
  '2025-06-20'
FROM public.accounts acc
WHERE acc.name = 'Quant ELSS';

-- Sell 10 units @220
WITH new_transaction AS (
  INSERT INTO public.transactions (user_id, description, transaction_date, total_amount)
  VALUES ('6bbc2fe7-5de6-4d82-a402-3ee8251604dc', 'Sell 10 Quant ELSS @220', '2025-06-20', 2200)
  RETURNING id
)
INSERT INTO public.transaction_entries (transaction_id, account_id, quantity, price, amount, entry_side, description)
SELECT nt.id, acc.id,
  CASE acc.name WHEN 'Quant ELSS' THEN 10 ELSE NULL END,
  CASE acc.name WHEN 'Quant ELSS' THEN 220 ELSE NULL END,
  2200,
  CASE acc.name
    WHEN 'Quant ELSS' THEN 'SELL'
    WHEN 'Bank: HDFC' THEN 'DEBIT'
  END::entry_side_enum,
  'Sell 10 units @220'
FROM new_transaction nt
CROSS JOIN public.accounts acc
WHERE acc.name IN ('Quant ELSS', 'Bank: HDFC');
