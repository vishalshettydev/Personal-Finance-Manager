-- ========= Set constants =========
WITH const AS (
  SELECT
    '6bbc2fe7-5de6-4d82-a402-3ee8251604dc'::uuid AS user_id
),
-- ========= Fetch account_type ids =========
account_types AS (
  SELECT
    (SELECT id FROM public.account_types WHERE name = 'Bank') AS bank_type_id,
    (SELECT id FROM public.account_types WHERE name = 'Mutual Fund') AS mf_type_id
),

-- ========= Create HDFC Bank Account =========
hdfc_bank AS (
  INSERT INTO public.accounts (
    user_id, parent_id, account_type_id, name, is_placeholder, balance
  )
  SELECT
    (SELECT user_id FROM const),
    (SELECT id FROM public.accounts WHERE name = 'Assets'),
    bank_type_id,
    'HDFC Bank',
    false,
    200000
  FROM account_types
  RETURNING id
),

-- ========= Create Mutual Funds → Quant Tax =========
mutual_funds AS (
  INSERT INTO public.accounts (
    user_id, parent_id, account_type_id, name, is_placeholder
  )
  SELECT
    (SELECT user_id FROM const),
    (SELECT id FROM public.accounts WHERE name = 'Assets'),
    mf_type_id,
    'Mutual Funds',
    true
  FROM account_types
  RETURNING id
),
quant_tax AS (
  INSERT INTO public.accounts (
    user_id, parent_id, account_type_id, name, is_placeholder
  )
  SELECT
    (SELECT user_id FROM const),
    (SELECT id FROM mutual_funds),
    mf_type_id,
    'Quant Tax',
    false
  FROM account_types
  RETURNING id
)

-- ========= Use constants for further inserts =========
SELECT * INTO TEMP const_ids FROM (
  SELECT
    (SELECT user_id FROM const) AS user_id,
    (SELECT id FROM hdfc_bank) AS hdfc_bank_id,
    (SELECT id FROM quant_tax) AS quant_tax_id
) AS x;

-- ========= Insert Opening Balance Transaction =========
WITH opening_txn AS (
  INSERT INTO public.transactions (
    user_id, reference_number, description, transaction_date, total_amount
  )
  VALUES (
    (SELECT user_id FROM const_ids),
    'OPENING-001',
    'Initial Balance in HDFC Bank',
    DATE '2023-01-01',
    200000
  )
  RETURNING id
)
INSERT INTO public.transaction_entries (
  transaction_id, account_id, quantity, price, entry_side, amount, description
)
VALUES
-- Debit HDFC Bank
(
  (SELECT id FROM opening_txn),
  (SELECT hdfc_bank_id FROM const_ids),
  0, 0, 'CREDIT', 200000,
  'Initial deposit into HDFC Bank'
),
-- Credit Opening Balance (Equity)
(
  (SELECT id FROM opening_txn),
  (SELECT id FROM public.accounts WHERE name = 'Opening Balance' AND is_placeholder = false),
  0, 0, 'DEBIT', 200000,
  'Offset opening balance from Equity'
);


DO $$
DECLARE
  i INT := 1;
  sip_count INT := 27;
  txn_id UUID;
  sip jsonb;
BEGIN
  WHILE i <= sip_count LOOP
    sip := (
      ARRAY[
        '{"units": 38.463, "nav": 233.9813, "amount": 9000}'::jsonb,
        '{"units": 40.640, "nav": 221.4457, "amount": 9000}',
        '{"units": 39.560, "nav": 272.9924, "amount": 10800}',
        '{"units": 40.914, "nav": 263.9541, "amount": 10800}',
        '{"units": 41.454, "nav": 260.5175, "amount": 10800}',
        '{"units": 32.957, "nav": 242.7250, "amount": 8000}',
        '{"units": 32.811, "nav": 242.8081, "amount": 8000}',
        '{"units": 8.004, "nav": 249.8760, "amount": 2000}',
        '{"units": 7.978, "nav": 250.6638, "amount": 2000}',
        '{"units": 8.026, "nav": 249.1833, "amount": 2000}',
        '{"units": 7.966, "nav": 251.0615, "amount": 2000}',
        '{"units": 7.683, "nav": 260.3118, "amount": 2000}',
        '{"units": 7.711, "nav": 259.3411, "amount": 2000}',
        '{"units": 7.778, "nav": 257.1080, "amount": 2000}',
        '{"units": 7.718, "nav": 259.1343, "amount": 2000}',
        '{"units": 7.453, "nav": 268.3383, "amount": 2000}',
        '{"units": 7.364, "nav": 271.5952, "amount": 2000}',
        '{"units": 7.357, "nav": 271.8386, "amount": 2000}',
        '{"units": 7.393, "nav": 270.4982, "amount": 2000}',
        '{"units": 7.131, "nav": 280.4581, "amount": 2000}',
        '{"units": 7.161, "nav": 279.2752, "amount": 2000}',
        '{"units": 7.001, "nav": 285.6446, "amount": 2000}',
        '{"units": 6.984, "nav": 286.3580, "amount": 2000}',
        '{"units": 6.905, "nav": 289.6269, "amount": 2000}',
        '{"units": 6.910, "nav": 289.4085, "amount": 2000}',
        '{"units": 6.873, "nav": 290.9846, "amount": 2000}',
        '{"units": 6.940, "nav": 288.1746, "amount": 2000}'
      ]
    )[i];

    -- Insert into transactions
    INSERT INTO public.transactions (
      user_id, reference_number, description, transaction_date, total_amount
    )
    VALUES (
      (SELECT user_id FROM const_ids),
      CONCAT('SIP-', LPAD(i::text, 3, '0')),
      'SIP into Quant Tax',
      DATE '2023-01-05' + (i - 1) * INTERVAL '30 days',
      (sip->>'amount')::NUMERIC
    )
    RETURNING id INTO txn_id;

    -- Insert entries
    INSERT INTO public.transaction_entries (
      transaction_id, account_id, quantity, price, entry_side, amount, description
    ) VALUES
    -- Debit HDFC Bank
    (
      txn_id,
      (SELECT hdfc_bank_id FROM const_ids),
      0, 0, 'DEBIT',
      (sip->>'amount')::NUMERIC,
      'SIP amount debited from HDFC Bank'
    ),
    -- Credit Quant Tax
    (
      txn_id,
      (SELECT quant_tax_id FROM const_ids),
      (sip->>'units')::NUMERIC,
      (sip->>'nav')::NUMERIC,
      'CREDIT',
      (sip->>'amount')::NUMERIC,
      'Units purchased for Quant Tax SIP'
    );

    -- Insert NAV
    INSERT INTO public.account_prices (
      user_id, account_id, price, date, notes
    )
    VALUES (
      (SELECT user_id FROM const_ids),
      (SELECT quant_tax_id FROM const_ids),
      (sip->>'nav')::NUMERIC,
      DATE '2023-01-05' + (i - 1) * INTERVAL '30 days',
      'NAV recorded for Quant Tax SIP'
    );

    i := i + 1;
  END LOOP;
END $$;
